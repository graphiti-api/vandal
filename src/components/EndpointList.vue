<template>
  <div class="endpoints" :class="{ 'has-selection': selection }">
    <input
      v-model="query"
      type="search"
      class="form-control search"
      placeholder="Search"
    />

    <a
      v-for="e in filteredEndpoints"
      :key="e"
      class="endpoint"
      :class="{ selected: selection === e }"
    >
      <div class="path" @click="toggle(e)">
        <span v-if="selection === e">&laquo;&nbsp;</span>
        {{ e | endpointDisplay }}
      </div>

      <span v-if="selection === e">
        <slot />
      </span>
    </a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import EventBus from '@/event-bus.ts'

export default Vue.extend({
  name: 'endpoint-list',
  props: ['endpoints'],
  data() {
    return {
      selection: null as any,
      query: null as string | null,
    }
  },
  filters: {
    endpointDisplay: function (endpoint: string) {
      let split = endpoint.split('/')
      return split[split.length - 1]
    },
  },
  computed: {
    filteredEndpoints(): string[] {
      let filtered = this.endpoints.filter((e: string) => {
        return e
      })

      if (this.query) {
        return filtered.filter((e: string) => {
          return e.includes(this.query)
        })
      } else {
        return filtered
      }
    },
  },
  mounted() {
    EventBus.$on('resetEndpoints', this.resetSelection)
  },
  methods: {
    toggle(endpoint: string) {
      if (this.selection) {
        this.selection = null
      } else {
        this.selection = endpoint
      }
      this.$emit('toggle', this.selection)
    },
    resetSelection() {
      this.selection = null
    },
  },
})
</script>

<style lang="scss" scoped>
@keyframes slide-endpoints-down {
  0% {
    opacity: 0;
    max-height: 1px;
  }

  99% {
    max-height: 2000px;
  }

  100% {
    opacity: 1;
    max-height: none;
  }
}

.endpoints {
  .search {
    transition: all 200ms;
    margin-bottom: 1rem;
  }

  &.has-selection {
    .search {
      max-height: 0;
      opacity: 0;
      padding: 0;
      margin: 0;
    }

    .endpoint {
      &.selected {
        max-height: 2000px;

        .path {
          color: lighten(orange, 20%);
          font-size: 120%;
          font-weight: bold;
          padding-bottom: 1rem;
        }
      }

      &:not(.selected) {
        opacity: 0;
        max-height: 0;
        margin: 0 !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
        border: none;
      }
    }
  }

  &:not(.has-selection) {
    .endpoint {
      &:hover {
        transition: all 0.1s;
        font-size: 110%;
        font-weight: bold;
        color: lighten(orange, 40%);
      }
    }
  }

  .endpoint {
    transition: all 0.3s;
    max-height: 200px;
    display: block;
    padding: 0.5rem 0 0.5rem 0;
    overflow: hidden;
    display: block;
    color: #f0f0f0;
    overflow: hidden;
    border-top: 1px dotted darken(grey, 22%);

    &:hover {
      color: #f0f0f0;
    }

    &.selected {
      border-top: none;
    }

    &:first-child {
      border-top: none;
    }

    &.selected {
      margin-bottom: 2rem;
    }
  }
}
</style>