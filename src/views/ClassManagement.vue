<template>
  <div class="class-management">
    <h2>班级管理</h2>
    
    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="班级名称">
            <a-input 
              v-model="searchParams.className" 
              placeholder="请输入班级名称" 
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
            <a-icon type="plus" />新增班级
          </a-button>
        </div>
        
        <a-table
          :columns="columns"
          :dataSource="classList"
          :rowKey="record => record.directorId + '_' + record.className"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
        >
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleEdit(record)">
                <a-icon type="edit" />编辑
              </a-button>
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
    
    <!-- 添加/编辑班级对话框 -->
    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      :confirmLoading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form-model
        ref="classForm"
        :model="classForm"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
      >
        <a-form-model-item label="班级名称" prop="className">
          <a-input v-model="classForm.className" placeholder="请输入班级名称" />
        </a-form-model-item>
        
        <a-form-model-item label="班级描述" prop="description">
          <a-textarea 
            v-model="classForm.description" 
            :rows="4" 
            placeholder="请输入班级描述"
          />
        </a-form-model-item>
        
        <a-form-model-item label="班主任" prop="directorName">
          <a-input v-model="classForm.directorName" placeholder="请输入班主任姓名" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'ClassManagement',
  data() {
    return {
      // 搜索参数
      searchParams: {
        className: '',
      },
      // 表格列定义
      columns: [
        {
          title: '班级名称',
          dataIndex: 'className',
          key: 'className',
          sorter: true,
        },
        {
          title: '班级描述',
          dataIndex: 'description',
          key: 'description',
          ellipsis: true,
        },
        {
          title: '班主任',
          dataIndex: 'directorName',
          key: 'directorName',
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          key: 'createTime',
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
        },
      ],
      // 班级列表数据
      classList: [],
      // 加载状态
      loading: false,
      // 分页信息
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: total => `共 ${total} 条记录`,
      },
      // 模态框标题
      modalTitle: '新增班级',
      // 模态框显示状态
      modalVisible: false,
      // 模态框加载状态
      modalLoading: false,
      // 是否为编辑模式
      isEdit: false,
      // 班级表单数据
      classForm: {
        id: undefined,
        className: '',
        description: '',
        directorId: null,
        directorName: '',
      },
      // 表单验证规则
      rules: {
        className: [
          { required: true, message: '请输入班级名称', trigger: 'blur' },
          { max: 50, message: '班级名称不能超过50个字符', trigger: 'blur' }
        ],
        description: [
          { max: 200, message: '班级描述不能超过200个字符', trigger: 'blur' }
        ],
        directorName: [
          { required: true, message: '请输入班主任姓名', trigger: 'blur' },
          { max: 20, message: '班主任姓名不能超过20个字符', trigger: 'blur' }
        ],
      },
    };
  },
  created() {
    this.fetchClassList();
  },
  methods: {
    // 获取班级列表
    fetchClassList() {
      this.loading = true;
      
      const params = {
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize,
        },
      };
      
      // 添加搜索条件
      if (this.searchParams.className) {
        params.className = this.searchParams.className;
      }
      
      // 发送请求
      axios.post(API.CLASS.PAGE, params)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const data = response.data.data || {};
            
            // 设置班级列表数据
            this.classList = data.records || []; // 从records获取数据列表
            
            // 更新分页信息
            this.pagination.total = data.total || 0;      // 直接使用total作为总记录数
            this.pagination.current = data.current || 1;  // 直接使用current作为当前页码
            this.pagination.pageSize = data.size || 10;   // 使用size作为页面大小
          } else {
            this.$message.error(response.data?.msg || '获取班级列表失败');
          }
        })
        .catch(error => {
          console.error('获取班级列表失败:', error);
          this.$message.error('获取班级列表失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 处理搜索
    handleSearch() {
      this.pagination.current = 1; // 重置到第一页
      this.fetchClassList();
    },
    
    // 处理重置
    handleReset() {
      this.searchParams = {
        className: '',
      };
      this.pagination.current = 1;
      this.fetchClassList();
    },
    
    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchClassList();
    },
    
    // 处理添加班级
    handleAdd() {
      this.modalTitle = '新增班级';
      this.isEdit = false;
      this.classForm = {
        id: undefined,
        className: '',
        description: '',
        directorId: null,
        directorName: '',
      };
      this.modalVisible = true;
    },
    
    // 处理编辑班级
    handleEdit(record) {
      this.modalTitle = '编辑班级';
      this.isEdit = true;
      this.classForm = { ...record };
      this.modalVisible = true;
    },
    
    // 处理删除班级
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除这个班级吗?',
        content: `班级名称: ${record.className}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          // 调用删除API
          this.deleteClass(record.id);
        },
      });
    },
    
    // 调用删除班级API
    deleteClass(id) {
      this.loading = true;
      
      axios.post(`${API.CLASS.DELETE}${id}`)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            this.$message.success('删除班级成功');
            this.fetchClassList();
          } else {
            this.$message.error(response.data?.msg || '删除班级失败');
          }
        })
        .catch(error => {
          console.error('删除班级失败:', error);
          this.$message.error('删除班级失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 处理模态框确认
    handleModalOk() {
      this.$refs.classForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          
          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.CLASS.UPDATE : API.CLASS.SAVE;
          
          axios.post(apiUrl, this.classForm)
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success(this.isEdit ? '编辑班级成功' : '新增班级成功');
                this.modalVisible = false;
                this.fetchClassList();
              } else {
                this.$message.error(response.data?.msg || (this.isEdit ? '编辑班级失败' : '新增班级失败'));
              }
            })
            .catch(error => {
              console.error(this.isEdit ? '编辑班级失败:' : '新增班级失败:', error);
              this.$message.error(this.isEdit ? '编辑班级失败，请稍后重试' : '新增班级失败，请稍后重试');
            })
            .finally(() => {
              this.modalLoading = false;
            });
        }
      });
    },
    
    // 处理模态框取消
    handleModalCancel() {
      this.modalVisible = false;
    },
  },
};
</script>

<style scoped>
.class-management {
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
  justify-content: space-between;
}

.action-buttons button {
  padding: 0 8px;
}
</style> 