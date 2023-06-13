// for createSuccessResponse()
const response = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const fragments = await Fragment.byUser(req.user, req.query.expand);
    res.status(200).send(response.createSuccessResponse({ fragments }));
    logger.info({ fragments }, `User's fragment list have been retrieved successfully`);
  } catch (err) {
    res.status(404).send(response.createErrorResponse(404, err));
  }
};
