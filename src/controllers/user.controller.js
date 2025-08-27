import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from '../utils/ApiErrors.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating the Token");
    }
}

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

const loginUser = asynchandler(async (req, res) => {
    /*
        req body -> data
        username or email
        find user
        password check
        access and refresh token
        send cookie
    */
    const { username, password, email } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "username or email is requiredf");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    });


    if (!user) {
        throw new ApiError(404, "User doesnt Exists!!!");
    }

    const validatePassword = await user.isPasswordCorrect(password);
    if (!validatePassword) {
        throw new ApiError(401, "Incorrect User Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("refreshToken", refreshToken, option)
        .cookie("accessToken", accessToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: refreshToken, accessToken, loggedInUser
                },
                "User Logged in Successfully"
            )
        )

})

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged Out Successfully"
            )
        )
})

const refreshAccessToken = asynchandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "UnAuthorise Access Token");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== decodedToken) {
            throw new ApiError(401, "Refresh Token is Expired or used");
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken, } = await generateAccessAndRefreshToken(user._id);

        return res.status(200)
            .cookie("refreshToken", newRefreshToken, option)
            .cookie("accessToken", accessToken, option)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token is refershed"
                )
            )
    } catch (error) {
        throw new ApiError(
            401, error?.message, "Invalid refresh Token"
        )
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }