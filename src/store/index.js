import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import API from '@/config/api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    menus: JSON.parse(localStorage.getItem('menus')) || [],
    token: localStorage.getItem('token') || null
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    SET_MENUS(state, menus) {
      state.menus = menus
      localStorage.setItem('menus', JSON.stringify(menus))
    },
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    CLEAR_USER(state) {
      state.user = null
      state.menus = []
      state.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('menus')
      localStorage.removeItem('token')
    }
  },
  actions: {
    login({ commit, dispatch }, userData) {
      // 保存用户数据到 store
      commit('SET_USER', {
        username: userData.username,
        realName: userData.realName,
        roleId: userData.roleId,
        sex: userData.sex,
        state: userData.state,
        // 如果没有头像，使用默认头像
        avatar: userData.avatar || 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'
      })
      
      // 保存 token 到 localStorage
      if (userData.token) {
        commit('SET_TOKEN', userData.token)
      }
      
      // 获取用户菜单权限
      dispatch('fetchUserMenus')
    },
    
    // 获取用户菜单权限
    async fetchUserMenus({ commit, state }) {
      try {
        // 确保有token
        if (!state.token) return;
        
        // 配置请求头携带token
        const headers = {
          'Authorization': `${state.token}`
        };
        
        // 修改为POST请求
        const response = await axios.post(API.MENU.GET_LIST, {}, { headers });
        
        if (response.data && (response.data.state === "ok" || response.data.code === 200)) {
          commit('SET_MENUS', response.data.data || []);
        } else {
          console.error('获取菜单失败:', response.data?.msg || '未知错误');
        }
      } catch (error) {
        console.error('获取菜单出错:', error);
      }
    },
    
    logout({ commit }) {
      commit('CLEAR_USER')
    }
  },
  getters: {
    loggedIn(state) {
      return !!state.user && !!state.token
    },
    currentUser(state) {
      return state.user
    },
    userMenus(state) {
      return state.menus
    }
  }
}) 