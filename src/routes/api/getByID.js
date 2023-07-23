const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const path = require('path');

module.exports = async (req, res) => {
  logger.debug(`getById called with fragment ID ${req.params.id}`);
  try {
    const fragment = await Fragment.byId(req.user, req.params.id.split('.')[0]);
    const fragmentData = await fragment.getData();
    const extension = path.extname(req.params.id);
    logger.warn('Extension:' + extension);
    // no extension passed or extension is same as type
    if (extension == '' || fragment.mimeType === Fragment.mimeLookup(extension)) {
      res.setHeader('Content-Type', fragment.type);
      res.status(200).send(fragmentData);
      logger.info(
        { fragmentData: fragmentData, contentType: fragment.type },
        `Fragment data retrieved successfully!`
      );
    }
    // needs conversion
    else {
      // call convert func
      const resultdata = await fragment.convertType(fragmentData, extension);
      if (!resultdata) {
        logger.warn('Fragment could not be converted to extension: ' + extension);
        return res
          .status(415)
          .json(createErrorResponse(415, 'Fragment cannot be converted to this type'));
      }
      res.set('Content-Type', Fragment.mimeLookup(extension));
      res.status(200).send(resultdata);
      logger.info(
        { resultData: resultdata, contentType: Fragment.mimeLookup(extension) },
        `Fragment converted successfully!`
      );
    }
  } catch (error) {
    logger.warn(`Invalid fragment ID ${req.params.id}`);
    res.status(404).json(createErrorResponse(404, error.message));
  }
};
