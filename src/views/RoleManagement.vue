<template>
  <div class="role-management">
    <h2>角色管理</h2>
    
    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="角色名称">
            <a-input 
              v-model="searchParams.roleName" 
              placeholder="请输入角色名称" 
              allowClear
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="创建人">
            <a-input 
              v-model="searchParams.createName" 
              placeholder="请输入创建人" 
              allowClear
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">
              <a-icon type="search" />查询
            </a-button>
            <a-button style="margin-left: 8px" @click="handleReset">
              <a-icon type="reload" />重置
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
      
      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
        <div class="table-operations">
          <a-button type="primary" @click="handleAdd">
            <a-icon type="plus" />新增角色
          </a-button>
        </div>
        
        <a-table
          :columns="columns"
          :dataSource="roleList"
          :rowKey="record => record.id"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
        >
          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleEdit(record)">
                <a-icon type="edit" />编辑
              </a-button>
              <a-button type="link" size="small" @click="() => handlePermission(record)">
                <a-icon type="safety" />权限设置
              </a-button>
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
    
    <!-- 添加/编辑角色对话框 -->
    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      :confirmLoading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      width="600px"
    >
      <a-form-model
        ref="roleForm"
        :model="roleForm"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="角色名称" prop="roleName">
          <a-input 
            v-model="roleForm.roleName" 
            placeholder="请输入角色名称"
          />
        </a-form-model-item>
        
        <a-form-model-item label="角色描述" prop="description">
          <a-textarea 
            v-model="roleForm.description" 
            placeholder="请输入角色描述"
            :rows="3"
          />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    
    <!-- 权限设置对话框 -->
    <a-modal
      title="权限设置"
      :visible="permissionModalVisible"
      :confirmLoading="permissionModalLoading"
      @ok="handlePermissionOk"
      @cancel="handlePermissionCancel"
      width="800px"
    >
      <div v-if="currentRole">
        <h3>当前角色: {{ currentRole.roleName }}</h3>
        <a-divider />
        
        <a-spin :spinning="menuLoading">
          <a-tree
            v-if="menuTree.length > 0"
            checkable
            :checkedKeys="checkedKeys"
            :treeData="menuTree"
            @check="handleMenuCheck"
          >
          </a-tree>
          <a-empty v-else description="暂无菜单数据" />
        </a-spin>
      </div>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'RoleManagement',
  data() {
    return {
      // 搜索参数
      searchParams: {
        roleName: '',
        createName: ''
      },
      // 表格列定义
      columns: [
        {
          title: '角色名称',
          dataIndex: 'roleName',
          key: 'roleName',
          width: '25%',
        },
        {
          title: '创建人',
          dataIndex: 'createBy',
          key: 'createBy',
          width: '20%',
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          key: 'createTime',
          width: '25%',
          sorter: true
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: '30%',
        },
      ],
      // 角色列表数据
      roleList: [],
      // 分页配置
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: total => `共 ${total} 条`,
        pageSizeOptions: ['10', '20', '30', '50'],
      },
      // 加载状态
      loading: false,
      
      // 角色表单模态框
      modalTitle: '新增角色',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      roleForm: {
        id: null,
        roleName: '',
        description: ''
      },
      rules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' },
          { max: 50, message: '角色名称不能超过50个字符', trigger: 'blur' },
        ],
        description: [
          { max: 200, message: '角色描述不能超过200个字符', trigger: 'blur' },
        ]
      },
      
      // 权限设置相关
      permissionModalVisible: false,
      permissionModalLoading: false,
      currentRole: null,
      menuTree: [],
      checkedKeys: [],
      menuLoading: false
    };
  },
  mounted() {
    this.fetchRoleList();
  },
  methods: {
    // 获取角色列表
    fetchRoleList() {
      this.loading = true;
      
      const params = {
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize,
        },
        ...this.searchParams
      };
      
      axios.post(API.ROLE.PAGE, params)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const data = response.data.data;
            
            this.roleList = data.records || [];
            
            // 更新分页信息
            this.pagination.total = data.total || 0;
            this.pagination.current = data.current || 1;
            this.pagination.pageSize = data.size || 10;
          } else {
            this.$message.error(response.data?.msg || '获取角色列表失败');
          }
        })
        .catch(error => {
          console.error('获取角色列表失败:', error);
          this.$message.error('获取角色列表失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 处理搜索
    handleSearch() {
      this.pagination.current = 1; // 重置到第一页
      this.fetchRoleList();
    },
    
    // 处理重置
    handleReset() {
      this.searchParams = {
        roleName: '',
        createName: ''
      };
      this.pagination.current = 1;
      this.fetchRoleList();
    },
    
    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchRoleList();
    },
    
    // 处理添加角色
    handleAdd() {
      this.modalTitle = '新增角色';
      this.isEdit = false;
      this.roleForm = {
        id: null,
        roleName: '',
        description: ''
      };
      this.modalVisible = true;
      
      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.roleForm) {
          this.$refs.roleForm.clearValidate();
        }
      });
    },
    
    // 处理编辑角色
    handleEdit(record) {
      this.modalTitle = '编辑角色';
      this.isEdit = true;
      this.roleForm = {
        id: record.id,
        roleName: record.roleName,
        description: record.description || ''
      };
      this.modalVisible = true;
      
      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.roleForm) {
          this.$refs.roleForm.clearValidate();
        }
      });
    },
    
    // 处理删除角色
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除该角色吗?',
        content: `角色名称: ${record.roleName}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.deleteRole(record.id);
        },
      });
    },
    
    // 调用删除角色API
    deleteRole(id) {
      this.loading = true;
      
      axios.post(API.ROLE.DELETE, { id })
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            this.$message.success('删除角色成功');
            this.fetchRoleList();
          } else {
            this.$message.error(response.data?.msg || '删除角色失败');
          }
        })
        .catch(error => {
          console.error('删除角色失败:', error);
          this.$message.error('删除角色失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 处理权限设置
    handlePermission(record) {
      this.currentRole = { ...record };
      this.permissionModalVisible = true;
      this.fetchRoleMenuList(record.id);
    },
    
    // 获取角色菜单权限
    fetchRoleMenuList(roleId) {
      this.menuLoading = true;
      
      axios.post(API.ROLE.GET_ROLE_MENU_LIST, { id: roleId })
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const menuList = response.data.data || [];
            
            // 处理菜单数据，转换为树形结构
            this.menuTree = this.convertToTreeData(menuList);
            
            // 设置已选中的菜单
            this.checkedKeys = menuList
              .filter(menu => menu.checked === 1)
              .map(menu => menu.menuId.toString());
              
          } else {
            this.$message.error(response.data?.msg || '获取角色菜单权限失败');
          }
        })
        .catch(error => {
          console.error('获取角色菜单权限失败:', error);
          this.$message.error('获取角色菜单权限失败，请稍后重试');
        })
        .finally(() => {
          this.menuLoading = false;
        });
    },
    
    // 将菜单列表转换为树形结构
    convertToTreeData(menuList) {
      // 首先筛选出一级菜单
      const rootMenus = menuList.filter(menu => menu.pid === 0);
      
      // 递归构建子菜单
      const buildTree = (menus) => {
        return menus.map(menu => {
          const children = menuList.filter(child => child.pid === menu.menuId);
          
          return {
            key: menu.menuId.toString(),
            title: menu.menuName,
            children: children.length > 0 ? buildTree(children) : null
          };
        });
      };
      
      return buildTree(rootMenus);
    },
    
    // 处理菜单选择变化
    handleMenuCheck(checkedKeys) {
      this.checkedKeys = checkedKeys.checked;
    },
    
    // 处理权限设置确认
    handlePermissionOk() {
      if (!this.currentRole) return;
      
      this.permissionModalLoading = true;
      
      // 构建提交数据
      const data = {
        id: this.currentRole.id,
        menuIds: this.checkedKeys.join(',')
      };
      
      axios.post(API.ROLE.UPDATE, data)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            this.$message.success('权限设置成功');
            this.permissionModalVisible = false;
          } else {
            this.$message.error(response.data?.msg || '权限设置失败');
          }
        })
        .catch(error => {
          console.error('权限设置失败:', error);
          this.$message.error('权限设置失败，请稍后重试');
        })
        .finally(() => {
          this.permissionModalLoading = false;
        });
    },
    
    // 处理权限设置取消
    handlePermissionCancel() {
      this.permissionModalVisible = false;
      this.currentRole = null;
      this.menuTree = [];
      this.checkedKeys = [];
    },
    
    // 处理角色模态框确认
    handleModalOk() {
      this.$refs.roleForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          
          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.ROLE.UPDATE : API.ROLE.SAVE;
          
          axios.post(apiUrl, this.roleForm)
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success(this.isEdit ? '编辑角色成功' : '新增角色成功');
                this.modalVisible = false;
                this.fetchRoleList();
              } else {
                this.$message.error(response.data?.msg || (this.isEdit ? '编辑角色失败' : '新增角色失败'));
              }
            })
            .catch(error => {
              console.error(this.isEdit ? '编辑角色失败:' : '新增角色失败:', error);
              this.$message.error(this.isEdit ? '编辑角色失败，请稍后重试' : '新增角色失败，请稍后重试');
            })
            .finally(() => {
              this.modalLoading = false;
            });
        }
      });
    },
    
    // 处理角色模态框取消
    handleModalCancel() {
      this.modalVisible = false;
    },
  },
};
</script>

<style scoped>
.role-management {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}

.search-card {
  margin-bottom: 16px;
  background: #f8f8f8;
}

.table-operations {
  margin-bottom: 16px;
  text-align: right;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
}

.action-buttons button {
  padding: 0 8px;
}
</style> 