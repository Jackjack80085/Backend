export class BadRequestError extends Error {
  public status = 400
  constructor(message?: string) {
    super(message || 'Bad Request')
    this.name = 'BadRequestError'
  }
}

export class ForbiddenError extends Error {
  public status = 403
  constructor(message?: string) {
    super(message || 'Forbidden')
    this.name = 'ForbiddenError'
  }
}
