

const errorHandlingMiddleware = (err, req, res) => {
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