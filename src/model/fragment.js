// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const sharp = require('sharp');
const md = require('markdown-it')();
const logger = require('../logger');
// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data/memory');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!type) {
      throw new Error('type is required');
    }
    if (!Fragment.isSupportedType(type)) {
      throw new Error('unsupported type');
    }
    if (!ownerId) {
      throw new Error('ownerId is required');
    }
    if (size < 0) {
      throw new Error('size must be >= 0');
    }
    if (typeof size !== 'number') {
      throw new Error('size must be a number');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size || 0;

    logger.debug(`Fragment details: ${JSON.stringify(this)}`);
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    return listFragments(ownerId, expand);
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error(`Fragment ${id} not found`);
    }

    return new Fragment(fragment);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data is not a Buffer');
    }
    this.updated = new Date().toISOString();
    this.size = data.length;
    await this.save();
    logger.debug(`Fragment ${this.id} data set`);

    return await writeFragmentData(this.ownerId, this.id, data);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns true if this fragment is a JSON mime type
   * @returns {boolean} true if fragment's type is application/json
   */
  get isJSON() {
    return this.mimeType === 'application/json';
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    let formats = [];
    switch (this.mimeType) {
      case 'text/plain':
        formats = ['text/plain'];
        break;
      case 'text/markdown':
        formats = ['text/markdown', 'text/html', 'text/plain'];
        break;
      case 'text/html':
        formats = ['text/html', 'text/plain'];
        break;
      case 'application/json':
        formats = ['application/json', 'text/plain'];
        break;
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
        formats = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
        break;
    }

    return formats;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain; charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const supportedType = [
      'text/plain',
      'text/plain; charset=utf-8',
      'text/markdown',
      'text/html',
      'application/json',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];

    return supportedType.includes(value);
  }

  /**
   * Return content type given extension
   * @param {string} extension an extension value (e.g., '.txt' or '.html')
   * @returns {string} the typename is returned (i.e., text/plain)
   */
  static mimeLookup(extension) {
    switch (extension) {
      case '.txt':
        return 'text/plain';
      case '.md':
        return 'text/markdown';
      case '.html':
        return 'text/html';
      case '.json':
        return 'application/json';
      case '.png':
      case '.webp':
      case '.gif':
        return `image/${extension.substring(1)}`;
      case '.jpg':
        return 'image/jpeg';
      default:
        return 'unsupported';
    }
  }

  async convertText(data, extension) {
    var result;
    if (extension === '.txt') {
      if (this.isJSON) {
        result = JSON.parse(data);
      } else {
        result = data;
      }
    } else if (extension == '.html') {
      if (this.mimeType === 'text/markdown') {
        result = md.render(data.toString());
      }
    }

    return result;
  }

  async convertImage(data, extension) {
    var result;
    try {
      const image = sharp(data);
      switch (extension) {
        case '.png':
          image.png();
          break;
        case '.jpg':
        case '.jpeg':
          image.jpeg();
          break;
        case '.webp':
          image.webp();
          break;
        case '.gif':
          image.gif();
          break;
      }
      result = await image.toBuffer();
    } catch (error) {
      logger.warn('Image conversion failed: ' + error.message);
    }

    return result;
  }

  /**
   * Returns the data converted to the desired type
   * @param {Buffer} data fragment data to be converted
   * @param {string} extension the extension type to convert to (desired type)
   * @returns {Buffer} converted fragment data
   */
  async convertType(data, extension) {
    // is text or json
    if (this.isText || this.isJSON) {
      return this.convertText(data, extension);
    }
    // is image
    else {
      return this.convertImage(data, extension);
    }
  }
}

module.exports.Fragment = Fragment;
