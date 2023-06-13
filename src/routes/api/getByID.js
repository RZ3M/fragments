const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    logger.debug(`getById called with fragment ID ${req.params.id}`);
    const fragment = await Fragment.byId(req.user, req.params.id);
    // res.status(200).send(fragment);

    try {
      const fragmentData = await fragment.getData();
      res.status(200).send(fragmentData);
    } catch (error) {
      res.status(415).json(createErrorResponse(415, error.message));
    }
  } catch (error) {
    logger.warn(`invalid fragment ID ${req.params.id}`);
    res.status(404).json(createErrorResponse(404, error.message));
  }
};
