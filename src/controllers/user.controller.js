import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from '../utils/ApiErrors.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'

const registerUser = asynchandler(async (req, res) => {
    /*
        get user details from frontend
        validation - not empty
        check if user already exists - email, username
        check for images, check for avatar
        upload them on cloudinary, avatar
        create user object and create entry in db
        remove password and refresh token from response
        check for user creation
        return response
    */
    const { email, username, password, fullName } = req.body;
    // console.log("email: ", email);

    if (
        [email, username, fullName, password].some((fields) => fields?.trim() == "")
    ) {
        throw new ApiError(400, "All the Field are required to fields");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User Already Exists !!!");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    if (!avatarLocalPath) {
        throw new ApiError(409, "Avatar Image is equired");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar Image is required");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Created Succesfully!!!")
    )
})

export { registerUser }