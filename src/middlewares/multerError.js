import { ReasonPhrases, StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import multer from "multer";

const multerError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      throw new ApiError(
        StatusCodes.REQUEST_TOO_LONG,
        ReasonPhrases.REQUEST_TOO_LONG,
        err.multerError
      );
    }
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      ReasonPhrases.INTERNAL_SERVER_ERROR,
      err.MulterError
    );
  }
  next(err);
};

export default multerError;
