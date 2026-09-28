export const validate = (zodSchema) => (req, res, next) => {
  const result = zodSchema.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
  req.body = result.data;
  next();
};