const errorMessages = {
  'Invalid login credentials': '邮箱或密码错误',
  'Email not confirmed': '邮箱未确认，可联系管理员重置密码',
  'User already registered': '该邮箱已注册',
  'Password should be at least 6 characters': '密码至少需要6位',
  'Unable to validate email address: invalid format': '邮箱格式不正确',
  'New password should be different from the old password': '新密码不能与旧密码相同',
  'Auth session missing': '登录已过期，请重新登录',
  'Token has expired': '登录已过期，请重新登录',
  'Invalid Refresh Token: Refresh Token Not Found': '登录已过期，请重新登录',
}

export function translateError(message) {
  if (!message) return '操作失败'
  return errorMessages[message] || message
}
