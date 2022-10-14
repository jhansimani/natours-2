import '@babel/polyfill';
import { login, logout } from './login.js';
import { updateUser, updatePassword, updateSettings } from './updateSettings';
import { bookTour } from './stripe';
const loginForm = document.querySelector('.form-login');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

const logoutBtn = document.querySelector('.nav__el--logout');

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

const updateForm = document.querySelector('.form');
if (updateForm) {
  updateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // const photo = document.getElementById('photo').value;
    updateSettings(form, 'data');
    // updateUser(name, email);
  });
}

const passwordForm = document.querySelector('.form-user-settings');

if (passwordForm) {
  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    // updatePassword(passwordCurrent, password, passwordConfirm);
    passwordCurrent = '';
    password = '';
    passwordConfirm = '';
  });
}

const bookBtn = document.getElementById('book-tour');

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
    e.target.textContent = 'Book tour Again';
  });
}
