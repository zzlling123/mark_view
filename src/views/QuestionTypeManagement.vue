<template>
  <div class="question-type-management">
    <h2>题库分类管理</h2>
    
    <div class="content-container">
      <!-- 表格区域 -->
      <a-card :bordered="false">
        <div class="table-operations">
          <a-button type="primary" @click="handleAdd">
            <a-icon type="plus" />新增分类
          </a-button>
        </div>
        
        <a-table
          :columns="columns"
          :dataSource="typeList"
          :rowKey="record => record.id"
          :pagination="false"
          :loading="loading"
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
    
    <!-- 添加/编辑分类对话框 -->
    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      :confirmLoading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form-model
        ref="typeForm"
        :model="typeForm"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-model-item label="分类名称" prop="typeName">
          <a-input v-model="typeForm.typeName" placeholder="请输入分类名称" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'QuestionTypeManagement',
  data() {
    return {
      // 表格列定义
      columns: [
        {
          title: '分类ID',
          dataIndex: 'id',
          key: 'id',
          width: 100,
        },
        {
          title: '分类名称',
          dataIndex: 'typeName',
          key: 'typeName',
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
          width: 150,
        }
      ],
      // 分类列表数据
      typeList: [],
      // 加载状态
      loading: false,
      
      // 模态框相关
      modalTitle: '新增分类',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      typeForm: {
        id: undefined,
        typeName: '',
      },
      rules: {
        typeName: [
          { required: true, message: '请输入分类名称', trigger: 'blur' },
          { max: 50, message: '分类名称不能超过50个字符', trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    this.fetchTypeList();
  },
  methods: {
    // 获取分类列表
    fetchTypeList() {
      this.loading = true;
      
      axios.post(API.QUESTION_TYPE.GET_LIST)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            // 确保每条记录有ID
            this.typeList = (response.data.data || []).map(item => ({
              ...item,
              id: item.id || `temp_${Math.random().toString(36).substr(2, 9)}` // 如果没有ID，生成临时ID
            }));
          } else {
            this.$message.error('获取分类列表失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取分类列表失败:', error);
          this.$message.error('获取分类列表失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 处理添加分类
    handleAdd() {
      this.modalTitle = '新增分类';
      this.isEdit = false;
      this.typeForm = {
        id: undefined,
        typeName: '',
      };
      this.modalVisible = true;
    },
    
    // 处理编辑分类
    handleEdit(record) {
      this.modalTitle = '编辑分类';
      this.isEdit = true;
      this.typeForm = { ...record };
      this.modalVisible = true;
    },
    
    // 处理删除分类
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除这个分类吗?',
        content: `分类名称: ${record.typeName}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          // 注意：后端API可能没有提供删除分类的接口
          this.$message.info('删除分类功能待实现');
        },
      });
    },
    
    // 处理模态框确认
    handleModalOk() {
      this.$refs.typeForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          
          // 注意：后端API可能没有提供保存或更新分类的接口
          setTimeout(() => {
            this.$message.info('保存分类功能待实现');
            this.modalLoading = false;
            this.modalVisible = false;
          }, 500);
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
.question-type-management {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
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