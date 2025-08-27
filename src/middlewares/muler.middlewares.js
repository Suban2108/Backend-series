import multer from "multer"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
filename: function (req, file, cb) {
  const ext = file.originalname.split('.').pop();
  cb(null, file.fieldname + "-" + Date.now() + "." + ext);
}

})

export const upload = multer({ storage })