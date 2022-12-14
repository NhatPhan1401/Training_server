import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import moment from 'moment';
import { floor, parseInt } from 'lodash';
import User, { UserType } from '../../models/user';
import { tokenGen, getIdFromReq, parseJwt } from '../../utils/token';
import {
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequesst,
  UpdateSelfUserRequest,
  UpdateUserRequest,
} from '../../models/api/user';

let refreshTokens: string[] = [];

const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, email, username, password, birthday }: UserType =
      req.body;
    const findUser = await User.find({ email });

    if (findUser.length > 0) {
      return res.status(500).json({ message: 'User already existed' });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const _id = new mongoose.Types.ObjectId();
      const user = new User({
        _id,
        displayName,
        email,
        username,
        password: hashedPassword,
        birthday,
        info: undefined,
        cart: [],
        purchase: [],
      });
      const savedUser = await user.save();
      if (savedUser) {
        const expiredDate = moment().add(7, 'days').format();
        const token = tokenGen(
          { _id: _id.toString(), role: savedUser.role },
          7
        );
        const refreshToken = tokenGen({ _id: _id.toString() }, 30);
        refreshTokens.push(refreshToken);
        return res
          .status(201)
          .json({ accessToken: token, expiredDate, refreshToken });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password }: LoginRequest = req.body;
    const findUser = username
      ? await User.find({ username })
      : await User.find({ email });
    if (findUser.length > 0) {
      const user = findUser[0];
      const compare = await bcrypt.compare(password, user.password);
      if (compare) {
        const expiredDate = moment().add(7, 'days').format();
        const token = tokenGen(
          { _id: user._id.toString(), role: user.role },
          7
        );
        const refreshToken = tokenGen({ _id: user._id.toString() }, 30);
        refreshTokens.push(refreshToken);
        return res
          .status(200)
          .json({ accessToken: token, expiredDate, refreshToken });
      } else {
        return res.status(500).json({ message: 'Incorrect Password' });
      }
    } else {
      return res.status(500).json({ message: 'Invalid Email or Username' });
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const logout = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken }: LogoutRequest = req.body;
    if (refreshToken) {
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const getSelfUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _id = getIdFromReq(req);
    const user = await User.findById(_id);
    if (user) {
      return res.status(200).json({
        _id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        birthday: user.birthday,
        info: user.info,
        role: user.role,
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);
    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _id = req.params.id;
    const {
      displayName,
      username,
      birthday,
      info,
      role,
      email,
      password,
    }: UpdateUserRequest = req.body;
    const findUser = await User.find({ username });
    if (findUser.length > 0 && findUser[0]._id.toString() !== _id) {
      return res.status(500).json({ message: 'Username already existed' });
    } else {
      const hashedPassword = password
        ? await bcrypt.hash(password, 10)
        : undefined;
      const updatedUser = await User.findOneAndUpdate(
        { _id },
        {
          $set: {
            displayName,
            username,
            birthday,
            info,
            role,
            email,
            password: hashedPassword,
          },
        },
        { new: true }
      );
      return res.status(200).json(updatedUser);
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const updateSelfUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = getIdFromReq(req);
    const { displayName, username, birthday, info }: UpdateSelfUserRequest =
      req.body;
    const findUser = await User.find({ username });
    if (findUser.length > 0 && findUser[0]._id.toString() !== _id) {
      return res.status(500).json({ message: 'Username already existed' });
    } else {
      const updatedUser = await User.findOneAndUpdate(
        { _id },
        { $set: { displayName, username, birthday, info } },
        { new: true }
      );
      if (updatedUser) {
        return res.status(200).json({
          _id: updatedUser._id,
          email: updatedUser.email,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          birthday: updatedUser.birthday,
          info: updatedUser.info,
          role: updatedUser.role,
        });
      } else {
        return res.status(500).json({ message: 'Update Profile Failed' });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _id = req.params.id;
    const deletedUser = await User.deleteOne({ _id });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ messsage: err });
  }
};

const getAllUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { offset, limit } = req.query;
    const users = await User.find()
      .skip(parseInt(offset?.toString() ?? '0'))
      .limit(parseInt(limit?.toString() ?? '0'));
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken }: RefreshTokenRequesst = req.body;
    if (
      refreshToken &&
      refreshTokens.findIndex((token) => token === refreshToken) > -1
    ) {
      const { _id } = parseJwt(refreshToken);
      const user = await User.findById(_id);
      if (user) {
        const expiredDate = moment().add(7, 'days').format();
        const token = tokenGen(
          { _id: user._id.toString(), role: user.role },
          7
        );
        refreshTokens.push(refreshToken);
        return res.status(200).json({ accessToken: token, expiredDate });
      } else {
        return res.status(404).json({ message: 'User Not Found' });
      }
    } else {
      return res.status(500).json({ message: 'Invalid Refresh Token' });
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

export default {
  login,
  logout,
  signup,
  getUser,
  getSelfUser,
  updateUser,
  updateSelfUser,
  deleteUser,
  getAllUser,
  refreshToken,
};
