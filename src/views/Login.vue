<template>
  <div class="login-container">
    <div class="login-form-container">
      <h2 class="login-title">系统登录</h2>
      <a-form
        id="loginForm"
        :form="form"
        class="login-form"
        @submit="handleSubmit"
      >
        <a-form-item>
          <a-input
            v-decorator="[
              'username',
              { rules: [{ required: true, message: '请输入账号!' }] }
            ]"
            placeholder="请输入账号"
            size="large"
          >
            <a-icon slot="prefix" type="user" style="color: rgba(0,0,0,.25)" />
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-input-password
            v-decorator="[
              'password',
              { rules: [{ required: true, message: '请输入密码!' }] }
            ]"
            placeholder="请输入密码"
            size="large"
          >
            <a-icon slot="prefix" type="lock" style="color: rgba(0,0,0,.25)" />
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <div class="captcha-container">
            <a-input
              v-decorator="[
                'captcha',
                { rules: [{ required: true, message: '请输入验证码!' }] }
              ]"
              placeholder="请输入验证码"
              style="width: 200px"
              size="large"
            >
              <a-icon slot="prefix" type="safety" style="color: rgba(0,0,0,.25)" />
            </a-input>
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" height="40" />
              <a-spin v-else />
            </div>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            class="login-form-button"
            size="large"
            :loading="loading"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  data() {
    return {
      form: this.$form.createForm(this),
      loading: false,
      captchaUrl: '',
      captchaUuid: '',
    }
  },
  created() {
    this.refreshCaptcha();
  },
  methods: {
    // 刷新验证码
    refreshCaptcha() {
      // 构建带时间戳的URL以避免缓存
      const timestamp = new Date().getTime();
      const captchaUrl = `${API.LOGIN.GET_VERIFICATION_CODE}?t=${timestamp}`;
      
      // 使用axios获取验证码图片，并从响应头获取UUID
      axios.get(captchaUrl, { responseType: 'blob' })
        .then(response => {
          // 从响应头获取UUID
          this.captchaUuid = response.headers.uuid;
          
          // 将Blob转换为URL以显示图片
          const blob = new Blob([response.data], { type: 'image/jpeg' });
          this.captchaUrl = URL.createObjectURL(blob);
        })
        .catch(error => {
          console.error('获取验证码失败:', error);
          this.$message.error('获取验证码失败，请稍后重试');
        });
    },
    
    // 提交登录表单
    handleSubmit(e) {
      e.preventDefault();
      this.form.validateFields((err, values) => {
        if (!err) {
          this.loading = true;
          
          // 构建登录请求数据
          const loginData = {
            username: values.username,
            password: values.password,
            code: values.captcha,
            uuid: this.captchaUuid
          };
          
          // 发送登录请求
          axios.post(API.LOGIN.LOGIN, loginData)
            .then(response => {
              // 登录成功处理
              if (response.data && (response.data.code === 200 || response.data.state === "ok")) {
                // 保存用户信息和token
                const userData = response.data.data || {};
                
                // 分发 login action 保存用户信息，并获取菜单权限
                this.$store.dispatch('login', userData);
                
                // 跳转到主页
                this.$router.push('/user-management');
                this.$message.success(response.data.msg || '登录成功!');
              } else {
                // 登录失败处理
                this.$message.error(response.data?.message || response.data?.msg || '登录失败，请检查用户名和密码');
                this.refreshCaptcha();
              }
            })
            .catch(error => {
              console.error('登录失败:', error);
              this.$message.error('登录失败，请稍后重试');
              this.refreshCaptcha();
            })
            .finally(() => {
              this.loading = false;
            });
        }
      });
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form-container {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.8s ease;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #1890ff;
  font-size: 24px;
}

.login-form-button {
  width: 100%;
}

.captcha-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.captcha-image {
  width: 120px;
  height: 40px;
  background: #f2f2f2;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  user-select: none;
  margin-left: 10px;
  overflow: hidden;
}

.captcha-image img {
  max-width: 100%;
  max-height: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form input, .login-form .ant-input-affix-wrapper {
  transition: all 0.3s;
}

.login-form input:focus, .login-form .ant-input-affix-wrapper:focus {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style> 