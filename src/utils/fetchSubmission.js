import ApiError from "./apiError.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import dotenv from "dotenv";
import axios from "axios";
import { axoisCEEHeaders } from "../constants.js";

dotenv.config();

// @DESC : Fetch the submission details from the compiler
export const fetchCompilerOutput = async (token) => {
  return new Promise((resolve, reject) => {
    try {
      if (!token) {
        return reject(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            ReasonPhrases.BAD_REQUEST,
            "Submission Token is missing"
          )
        );
      }

      const options = {
        method: "GET",
        params: {
          base64_encoded: "true",
          fields: "compile_output,status",
        },
        headers: axoisCEEHeaders,
      };

      const interval = setInterval(async () => {
        try {
          const URL = `${process.env.CEE_URI}/submissions/${token}`;
          const response = await axios.request(URL, options);

          if (response.data.status?.id > 2) {
            clearInterval(interval);

            if (response.data.compile_output) {
              resolve({
                status: StatusCodes.BAD_REQUEST,
                message: response.data.compile_output,
              });
            } else {
              resolve({
                status: StatusCodes.OK,
                message: "Compilation Successful",
              });
            }
          }
        } catch (error) {
          console.log("Error in fetchCompilerOutput : ", error);
          clearInterval(interval);
          reject(
            new ApiError(
              StatusCodes.INTERNAL_SERVER_ERROR,
              ReasonPhrases.INTERNAL_SERVER_ERROR,
              error
            )
          );
        }
      }, 1500);

      setTimeout(() => {
        clearInterval(interval);
        reject(
          new ApiError(
            StatusCodes.REQUEST_TIMEOUT,
            ReasonPhrases.REQUEST_TIMEOUT,
            "Compilation took too long"
          )
        );
      }, 15000);
    } catch (error) {
      reject(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          ReasonPhrases.INTERNAL_SERVER_ERROR,
          " Error in fetchCompilerOutput"
        )
      );
    }
  });
};

// @DESC : Fetch a single submission from the CEE
// @INPUT token
export const fetchSingleSubmission = async (token) => {
  return new Promise((resolve, reject) => {
    try {
      if (!token) {
        return reject(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            ReasonPhrases.BAD_REQUEST,
            "Submission Token is missing"
          )
        );
      }

      const options = {
        method: "GET",
        params: {
          base64_encoded: "true",
          fields: "time,status,memory,stdout",
        },
        headers: axoisCEEHeaders,
      };

      const interval = setInterval(async () => {
        try {
          const URL = `${process.env.CEE_URI}/submissions/${token}`;
          const response = await axios.request(URL, options);

          if (response.data.status?.id > 2) {
            clearInterval(interval);

            resolve({
              status: response.data.status.id,
              stdout: response.data.stdout,
              time: response.data.time,
              memory: response.data.memory,
            });
          }
        } catch (error) {
          console.log("Error in fetchSingleSubmission : ", error);
          clearInterval(interval);
          reject(
            new ApiError(
              StatusCodes.INTERNAL_SERVER_ERROR,
              ReasonPhrases.INTERNAL_SERVER_ERROR,
              error
            )
          );
        }
      }, 1500);

      setTimeout(() => {
        clearInterval(interval);
        reject(
          new ApiError(
            StatusCodes.REQUEST_TIMEOUT,
            ReasonPhrases.REQUEST_TIMEOUT,
            "Compilation took too long"
          )
        );
      }, 15000);
    } catch (error) {
      reject(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          ReasonPhrases.INTERNAL_SERVER_ERROR,
          " Error in fetchSingleSubmission"
        )
      );
    }
  });
};
