// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
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
    this.size = data.length;
    await this.save();
    logger.info(`Fragment ${this.id} data set`);

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
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // let formats = [];
    // switch (this.mimeType) {
    //   case 'text/plain':
    //     formats = ['.txt'];
    //     break;
    //   case 'text/markdown':
    //     formats = ['.md', '.html', '.txt'];
    //     break;
    //   case 'text/html':
    //     formats = ['.html', '.txt'];
    //     break;
    //   case 'application/json':
    //     formats = ['.json', '.txt'];
    //     break;
    //   case 'image/png':
    //   case 'image/jpeg':
    //   case 'image/webp':
    //   case 'image/gif':
    //     formats = ['.png', '.jpg', '.webp', '.gif'];
    //     break;
    // }

    // return formats;

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
}

module.exports.Fragment = Fragment;
