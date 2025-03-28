<template>
  <a-layout class="main-layout">
    <a-layout-header class="header">
      <div class="logo">管理系统</div>
      <div class="user-info" v-if="user">
        <a-avatar :src="user.avatar" />
        <span class="username">{{ user.realName || user.username }}</span>
      </div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider width="200" style="background: #fff">
        <a-menu
          mode="inline"
          :selectedKeys="[selectedKey]"
          :defaultOpenKeys="openKeys"
          style="height: 100%"
        >
          <!-- 动态菜单 -->
          <template v-for="menu in userMenus">
            <!-- 一级菜单（有子菜单的情况） -->
            <a-sub-menu v-if="menu.childMenuList && menu.childMenuList.length > 0" :key="'menu-'+menu.menuId">
              <span slot="title">
                <a-icon :type="getMenuIcon(menu)" />
                <span>{{ menu.menuName }}</span>
              </span>
              
              <!-- 二级菜单 -->
              <a-menu-item 
                v-for="childMenu in menu.childMenuList" 
                :key="'menu-'+childMenu.menuId"
                @click="() => navigateByMenu(childMenu)"
              >
                <a-icon :type="getMenuIcon(childMenu)" />
                <span>{{ childMenu.menuName }}</span>
              </a-menu-item>
            </a-sub-menu>
            
            <!-- 一级菜单（无子菜单的情况） -->
            <a-menu-item v-else :key="'menu-'+menu.menuId" @click="() => navigateByMenu(menu)">
              <a-icon :type="getMenuIcon(menu)" />
              <span>{{ menu.menuName }}</span>
            </a-menu-item>
          </template>
          
          <!-- 练习任务菜单 - 始终显示 -->
          <a-sub-menu key="task">
            <span slot="title">
              <a-icon type="experiment" />
              <span>练习任务</span>
            </span>
            <a-menu-item key="2d-annotation" @click="() => navigate('task/2d-annotation')">
              <a-icon type="border" />
              <span>2D标注</span>
            </a-menu-item>
            <a-menu-item key="3d-annotation" @click="() => navigate('task/3d-annotation')">
              <a-icon type="box-plot" />
              <span>3D标注</span>
            </a-menu-item>
            <a-menu-item key="audio-annotation" @click="() => navigate('task/audio-annotation')">
              <a-icon type="sound" />
              <span>音频标注</span>
            </a-menu-item>
          </a-sub-menu>
          
          <a-menu-item key="logout" @click="logout">
            <a-icon type="logout" />
            <span>退出系统</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout-content class="content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import { mapGetters } from 'vuex'

// 菜单图标映射
const MENU_ICON_MAP = {
  '系统设置': 'setting',
  '用户管理': 'user',
  '班级管理': 'team',
  '角色管理': 'safety',
  '登录日志': 'history',
  '操作日志': 'file-text',
  '题库分类': 'folder',
  '考试管理': 'form',
  '考务创建': 'schedule',
  '课程管理': 'book',
  '题库管理': 'database',
  '标签管理': 'tags',
  '成绩统计': 'bar-chart',
  '学生成绩统计': 'usergroup-add',
  '班级成绩统计': 'cluster',
  // 默认图标用 'appstore'
};

export default {
  data() {
    return {
      selectedKey: this.getInitialSelectedKey(),
      openKeys: ['task']
    }
  },
  computed: {
    ...mapGetters({
      user: 'currentUser',
      userMenus: 'userMenus'
    })
  },
  watch: {
    $route() {
      this.updateSelectedKey()
    },
    userMenus: {
      handler(newMenus) {
        if (newMenus && newMenus.length > 0) {
          // 更新打开的菜单项
          this.openKeys = [...this.openKeys, ...newMenus.map(menu => 'menu-' + menu.menuId)];
        }
      },
      immediate: true
    }
  },
  methods: {
    navigate(path) {
      this.$router.push(`/${path}`)
    },
    logout() {
      this.$store.dispatch('logout')
      this.$router.push('/login')
      this.$message.success('已成功退出系统')
    },
    updateSelectedKey() {
      const path = this.$route.path
      if (path.includes('user-management')) {
        this.selectedKey = 'user-management'
      } else if (path.includes('class-management')) {
        this.selectedKey = 'class-management'
      } else if (path.includes('2d-annotation')) {
        this.selectedKey = '2d-annotation'
      } else if (path.includes('3d-annotation')) {
        this.selectedKey = '3d-annotation'
      } else if (path.includes('audio-annotation')) {
        this.selectedKey = 'audio-annotation'
      }
    },
    getInitialSelectedKey() {
      const path = this.$route.path
      if (path.includes('user-management')) {
        return 'user-management'
      } else if (path.includes('class-management')) {
        return 'class-management'
      } else if (path.includes('2d-annotation')) {
        return '2d-annotation'
      } else if (path.includes('3d-annotation')) {
        return '3d-annotation'
      } else if (path.includes('audio-annotation')) {
        return 'audio-annotation'
      }
      return 'user-management'
    },
    navigateByMenu(menu) {
      // 根据menu.route进行路由跳转
      // 如果menu.route为空，则使用默认路由
      const route = menu.route || `/menu/${menu.menuId}`;
      this.$router.push(route);
      this.selectedKey = 'menu-' + menu.menuId;
    },
    getMenuIcon(menu) {
      return MENU_ICON_MAP[menu.menuName] || 'appstore';
    }
  },
  created() {
    this.updateSelectedKey()
    
    // 如果用户已登录但没有菜单数据，则获取菜单
    if (this.user && (!this.userMenus || this.userMenus.length === 0)) {
      this.$store.dispatch('fetchUserMenus');
    }
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  background: #fff;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-left: 8px;
  font-size: 14px;
}

.content {
  padding: 24px;
  background: #f0f2f5;
  min-height: 280px;
}

.content-wrapper {
  padding: 24px;
  background: #fff;
  min-height: 100%;
  border-radius: 4px;
}
</style> 