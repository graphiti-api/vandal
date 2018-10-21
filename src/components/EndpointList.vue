<template>
  <div class="endpoints" :class="{ 'has-selection': selection }">
    <input
      v-model="query"
      type="search"
      class="form-control search"
      placeholder="Search"
    />

    <a v-for="e in filteredEndpoints" :key="e" class="endpoint" :class="{ selected: selection === e }">
      <div class="path" @click="toggle(e)">
        <span v-if="selection === e">&laquo;&nbsp;</span>
        {{ e }}
      </div>

      <span v-if="selection === e">
        <slot />
      </span>
    </a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ResourceForm from '@/components/ResourceForm.vue'

export default Vue.extend({
  name: 'endpoint-list',
  props: ['endpoints'],
  components: {
    ResourceForm
  },
  data() {
    return {
      selection: null as any,
      query: null as string | null
    }
  },
  computed: {
    filteredEndpoints() : string[] {
      if (this.query) {
        return this.endpoints.filter((e: string) => {
          return e.includes(this.query)
        })
      } else {
        return this.endpoints
      }
    },
  },
  methods: {
    toggle(endpoint: string) {
      if (this.selection) {
        this.selection = null
      } else {
        this.selection = endpoint
      }
      this.$emit('toggle', this.selection)
    }
  }
});
</script>

<style lang="scss" scoped>
</style>