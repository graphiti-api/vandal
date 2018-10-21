<template>
  <div class="data-table" :class="{ inactive: !active }">
    <div class="contents">
      <div class="relationship-label" v-if="label">
        <span class="arrow">&#8627;</span> {{ label }}
      </div>

      <div v-if="object.rows.length > 0" class="clearfix view-as-json">
        <a @click="jsonView(object)">View as JSON</a>
      </div>

      <div v-if="object.rows.length > 0" class="table-wrapper">
        <table class="results table table-hover table-borderless" :class="{ 'has-selection': object.selectedRow, 'is-sub-table': isSubTable, [object.css]: true }">
          <thead>
            <tr>
              <th v-for="header in object.headers" :key="header">
                {{ header }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr @click="toggleRow(row)" class="data-row" v-for="row in object.rows" :key="row.attrs.id.value" :class="{ selected: object.selectedRow === row, 'has-relationships': row.hasRelationships }">
              <td v-for="(config, key) in row.attrs" :key="key" :class="{ ['type-'+config.type]: true }">
                <div class="td-contents">
                  <div v-if="config.type == 'datetime'">
                    {{ config.value | dateTimeType }}
                  </div>
                  <div v-else-if="config.type == 'date'">
                    {{ config.value | dateType }}
                  </div>
                  <div v-else>
                    {{ config.value }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card">
        No Data
      </div>

      <transition name="relationship-table">
        <span v-if="(depth === 0 && isShowAction) || object.selectedRow">
          <data-table
            :label="key"
            :object="data" v-for="(data, key) in relationships"
            :key="key"
            :isSubTable="true"
            :depth="depth+1"
            @rowClick="onSubRowClick"
            :isShowAction="isShowAction"
          />
        </span>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import EventBus from '@/event-bus.ts'

export default Vue.extend({
  name: 'data-table',
  props: ['object', 'depth', 'label', 'isShowAction', 'isSubTable'],
  data() {
    return {
      active: true
    }
  },
  computed: {
    relationships() : any {
      if (this.isShowAction) {
        return this.object.rows[0].relationships
      } else {
        return this.object.selectedRow.relationships
      }
    }
  },
  methods: {
    jsonView(object: any) {
      EventBus.$emit('modalToggle', object.formattedJSON())
    },
    toggleRow(row: any) {
      if (this.object.selectedRow) {
        this.object.selectedRow = null
        // but not necessarily active false
      } else {
        this.active = true
        this.object.selectedRow = row
      }
      // listen for this
      // if not the selectedRow, then set flag for inactive class
      // inactives fade up and away
      // but when click AGAIN, slide back previous
      // this.$emit('rowClick', this.object.selectedRow)
    },
    onSubRowClick(row: any) {
      if (row) {
        this.active = false
      } else {
        this.active = true
      }
    }
  }
})
</script>

<style lang="scss" scoped>
$success: lighten(green, 60%);
$danger: lighten(red, 20%);
$warning: lighten(yellow, 20%);
$darkCard: #5c666f;
$table: darken(grey, 30%);

.relationship-label {
  text-align: left;
  color: $warning;
  font-size: 110%;
  letter-spacing: 2px;
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
}

.data-table {
  .view-as-json {
    text-align: right;

    a {
      float: right;
    }
  }

  &.inactive {
    > .contents {
      transform: translateY(-200px);
      max-height: 0;
      opacity: 0;
    }
  }

  table.results {
    th:first-child {
      min-width: 2rem !important;
    }

    td:first-child {
      width: 1px;
      white-space:nowrap;
      transition: all 0ms;
    }

    tr {
      cursor: pointer;

      &.selected {
        td:first-child .td-contents {
          overflow: visible;

          div {
            overflow: visible;
          }
        }
      }

      &.has-relationships {
        &:hover {
          border-left: 1px solid orange;
        }
      }

      &:hover {
        td:first-child {
          color: orange;
          font-weight: bold;
          text-shadow: 1px 1px 2px black;
        }
      }
    }

    @for $i from 0 through 10 {
      &.id-length-#{$i} {
        @if 0.7*$i < 2 {
          th:first-child {
            width: 2rem !important;
          }
        }

        td:first-child, th:first-child {
          width: 0.9rem * $i;
        }
      }
    }
  }
}

.data-table {
  > .contents {
    transition: all 3000ms;
  }
}
</style>