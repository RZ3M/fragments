const { Fragment } = require('../../model/fragment');
const { createErrorResponse, createSuccessResponse } = require('../../response');
const logger = require('../../logger');
const api = process.env.API_URL;

module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    if (req.get('Content-Type') != fragment.type) {
      res.status(400).send(createErrorResponse(400, 'Fragment type can not be changed.'));
    } else {
      await fragment.setData(req.body);
      res.location(`${api}/v1/fragments/${fragment.id}`);
      res.status(200).send(createSuccessResponse({ fragment, formats: fragment.formats }));
      logger.info({ fragment: fragment }, `Successfully updated fragment data!`);
    }
  } catch (err) {
    res.status(404).send(createErrorResponse(404, 'Unknown fragment'));
  }
};
