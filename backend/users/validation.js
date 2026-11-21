const STARTING_LEVELS = new Set([
  'Beginner (Sounds & Words)',
  'Intermediate (Short Phrases)',
  'Advanced (Sentences)',
]);
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_IMAGE_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

function decodeImage(value, fieldName, required = false) {
  if (!value && !required) return undefined;
  if (typeof value !== 'string' || value.length > MAX_IMAGE_BASE64_LENGTH || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`${fieldName} must be a valid image under 1 MB.`);
  }

  const image = Buffer.from(value, 'base64');
  if (image.length === 0 || image.length > MAX_IMAGE_BYTES || image.toString('base64') !== value) {
    throw new Error(`${fieldName} must be a valid image under 1 MB.`);
  }
  return image;
}

function validateRegistration(body) {
  const fields = ['fullName', 'email', 'contactNo', 'password', 'childName', 'childAge', 'startingLevel', 'studentId'];
  for (const field of fields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new Error(`${field} is required.`);
    }
  }

  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const password = body.password;
  if (
    password.length < 8 ||
    password.length > 20 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>\-_]/.test(password)
  ) {
    throw new Error('Password does not meet the required security rules.');
  }

  const childAge = Number(body.childAge);
  if (!Number.isInteger(childAge) || childAge < 0 || childAge > 18) {
    throw new Error('Child age must be a whole number between 0 and 18.');
  }
  if (!/^\d{7,15}$/.test(body.contactNo.trim())) {
    throw new Error('Contact number must contain 7 to 15 digits.');
  }
  if (!STARTING_LEVELS.has(body.startingLevel)) {
    throw new Error('Choose a valid starting level.');
  }
  if (!/^\d{1,30}$/.test(body.studentId.trim())) {
    throw new Error('Student ID must contain only digits.');
  }
  if (body.contactNo.trim().length > 40 || body.fullName.trim().length > 120 || body.childName.trim().length > 120) {
    throw new Error('One or more fields exceed the maximum length.');
  }

  return {
    fullName: body.fullName.trim(),
    email,
    contactNo: body.contactNo.trim(),
    password,
    childName: body.childName.trim(),
    childAge,
    startingLevel: body.startingLevel,
    studentId: body.studentId.trim(),
    profileImage: decodeImage(body.profileImageData, 'Profile image'),
    verificationImage: decodeImage(body.verificationImageData, 'Verification image', true),
  };
}

module.exports = { validateRegistration };
