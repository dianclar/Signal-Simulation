<script setup>
import { ref } from 'vue'
import { Delete, Setting } from '@element-plus/icons-vue'

// 与 App.vue 双向绑定的共享状态
const mainRouterModel = defineModel('mainRouterModel', {
  type: String,
  default: '华为HS8546V5',
})
const subRouterModel = defineModel('subRouterModel', {
  type: String,
  default: '华为K662c',
})
const coverageRadius = defineModel('coverageRadius', {
  type: Number,
  default: 180,
})
const scale = defineModel('scale', { type: Number, default: 1 })
const slider = defineModel('slider', { type: Number, default: 80 })

// 面板内部状态
// 信号频率为占位控件：当前版本未接入频率对热力图/覆盖范围仿真影响（保留 UI 不影响功能）
const frequency = ref('5GHz')

const props = defineProps({
  isHeat: { type: Boolean, default: false },
  divarr: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update-radius',
  'update-scale',
  'heat-toggle',
  'slider-change',
  'delete-device',
  'open-config',
])
</script>

<template>
  <aside class="right-panel">
    <h3>设备配置</h3>
    <el-form label-position="top">
      <el-form-item label="主光猫型号">
        <el-select
          v-model="mainRouterModel"
          placeholder="请选择"
        >
          <el-option
            label="华为HS8546V5"
            value="华为HS8546V5"
          />
          <el-option
            label="华硕RT-AX86U"
            value="华硕RT-AX86U"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="从光猫型号">
        <el-select
          v-model="subRouterModel"
          placeholder="请选择"
        >
          <el-option
            label="华为K662c"
            value="华为K662c"
          />
          <el-option
            label="TP-Link AX3000"
            value="TP-Link AX3000"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="默认覆盖半径(像素)">
        <el-input
          v-model.number="coverageRadius"
          placeholder="请输入数值"
          @change="emit('update-radius', coverageRadius)"
        />
      </el-form-item>

      <el-form-item label="比例尺 (像素/米)">
        <el-input
          v-model.number="scale"
          placeholder="请输入数值"
          @change="emit('update-scale', scale)"
        />
      </el-form-item>
    </el-form>

    <h3>已添加设备</h3>
    <div class="added-devices">
      <p v-if="divarr.length === 0">没有设备</p>
      <div
        v-for="value in divarr"
        :key="value.name"
        class="addeditem"
      >
        <div style="display: flex; align-items: center; gap: 10px">
          <div
            class="addeditemcol"
            :style="{
              background: value.color || value.div.style.background,
            }"
          ></div>
          <div>{{ value.name }}</div>
        </div>
        <div style="display: flex; gap: 5px; cursor: pointer">
          <el-icon @click="emit('open-config', { ...value })">
            <Setting></Setting> </el-icon
          ><el-icon @click="emit('delete-device', value)">
            <Delete></Delete>
          </el-icon>
        </div>
      </div>
    </div>

    <h3>信号仿真</h3>
    <el-form label-position="top">
      <el-form-item label="信号频率">
        <el-select
          v-model="frequency"
          placeholder="请选择"
        >
          <el-option
            label="2.4GHz"
            value="2.4GHz"
          />
          <el-option
            label="5GHz"
            value="5GHz"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <el-button
      type="primary"
      @click="emit('heat-toggle')"
      style="width: 100%"
      >{{ isHeat ? '隐藏' : '查看' }}热力图</el-button
    >

    <h3>热力图透明度</h3>
    <el-slider
      v-model="slider"
      :step="10"
      :show-tooltip="false"
      @change="emit('slider-change')"
      size="small"
      :min="10"
      :max="100"
    />

    <div class="heatimg"></div>
    <div style="display: flex; justify-content: space-between; color: #999">
      <div>弱信号</div>
      <div>中等信号</div>
      <div>强信号</div>
    </div>

    <h3>组网建议</h3>
    <div v-show="divarr.length == 0">
      请添加AP设备并生成热力图以获取组网建议。
    </div>
    <div v-show="divarr.length > 0">
      当前配置:
      {{ divarr.filter(item => item.name.includes('主')).length }}个主光猫，{{
        divarr.filter(item => item.name.includes('从')).length
      }}个从光猫。<span
        v-show="divarr.filter(item => item.name.includes('主')).length > 1"
        >建议只保留一个主光猫，多个主光猫可能导致信号干扰。考虑添加从光猫以扩展覆盖范围。</span
      ><span
        v-show="divarr.filter(item => item.name.includes('主')).length === 0"
        >建议添加至少一个主光猫。</span
      >
    </div>
  </aside>
</template>
