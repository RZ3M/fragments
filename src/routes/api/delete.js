const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug(`owner id: ${req.user}, id: ${req.params.id}`);
  const id = req.params.id;
  try {
    const fragment = await Fragment.byId(req.user, id);
    if (!fragment) {
      return res.status(404).json(createErrorResponse(404, 'Id not found'));
    }
    await Fragment.delete(req.user, id);
    res.status(200).send(createSuccessResponse(200, 'Fragment successfully deleted!'));
  } catch (e) {
    res.status(500).send(createErrorResponse(500, e.message));
  }
};
