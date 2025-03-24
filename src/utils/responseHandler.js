class ResponseHandler {
  static success(res, data = {}, message = "successfull", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  static error(
    res,
    error = [],
    message = "something went wrong",
    statutCode = 500
  ) {
    return res.status(statutCode).json({
      success: false,
      statutCode,
      message,
      error,
    });
  }
}

export default ResponseHandler;
