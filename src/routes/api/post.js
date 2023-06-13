const response = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const url = process.env.API_URL || req.hostname;
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('body does not contain data');
    return res.status(415).json(response.createErrorResponse(415, 'Unsupported data type.'));
  } else {
    const fragment = new Fragment({
      ownerId: req.user,
      type: req.get('Content-Type'),
    });
    await fragment.setData(req.body);

    const location = req.protocol + '://' + url + ':8080/v1' + req.url + '/' + fragment.id;
    res
      .set({ Location: location })
      .status(201)
      .json(
        response.createSuccessResponse({
          fragment: fragment,
        })
      );
    logger.info({ fragment: fragment }, `Fragment have been posted successfully`);
  }
};
