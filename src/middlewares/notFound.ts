import { Request, Response, NextFunction } from 'express'

function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({ error: 'Not Found' })
}

export default notFound
