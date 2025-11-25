

// 'next' is required for Express error-handling middleware signature, even if unused — disable ESLint warning.
/* eslint-disable-next-line no-unused-vars */
const errorHandlingMiddleware = (err, req, res, next) => {
  if (err.status != null) {
    res.status(err.status).json({
        msg: err.response.data.message,
        success: false,
      });
  } else {
    res.status(500).json({
      msg:"Unknown", 
      success: false
    });
  }
};

//TODO improve error handling
function asyncCatch(fn){

  return (req, res, next) => {

      Promise
          .resolve(fn(req, res, next))
           .catch((err) => {
              next(err);
          })
  };
}

export {errorHandlingMiddleware, asyncCatch};