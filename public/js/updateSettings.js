import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  const url =
    type === 'password'
      ? 'http://localhost:4000/api/v1/users/updatePassword'
      : 'http://localhost:4000/api/v1/users/updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url: url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated successfully`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
export const updateUser = async (name, email) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:4000/api/v1/users/updateMe',
      data: {
        name: name,
        email: email,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Updated successfully');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const updatePassword = async (
  passwordCurrent,
  password,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:4000/api/v1/users/updatePassword',
      data: {
        passwordCurrent: passwordCurrent,
        password: password,
        passwordConfirm: passwordConfirm,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Updated successfully');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
