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
      if (this.isShowAction && this.depth === 0) {
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
      } else {
        this.active = true
        this.object.selectedRow = row
      }
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

@keyframes relationship-table {
  0% {
    opacity: 0;
    transform: translateY(-300px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
}

@keyframes table-select {
  50% {
    transform: scale(0.95);
  }
  80% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

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

  .table-wrapper {
    overflow-y: scroll;
  }

  &.inactive {
    > .contents {
      transform: translateY(-200px);
      max-height: 0;
      opacity: 0;
    }
  }

  table.results {
    $duration: 250ms;

    @for $i from 7 through 50 {
      &.columns-#{$i} {
        width: 100% + 20% * ($i - 6);
      }
    }

    &.columns-6 {
      width: 100%;
    }

    &.relationship-table {
      animation: relationship-table 300ms;
    }

    &:not(.has-selection) {
      tbody tr:nth-child(odd)  {
        border-top: 1px solid rgba(255,255,255,0.1);
        border-bottom: 1px solid rgba(0,0,0,0.3);
      }
    }

    &.has-selection {
      animation: table-select 250ms;

      td {
        border: none;
      }

      tr.data-row.selected {
        border-top: 1px solid rgba(255,255,255,0.1) !important;
        background-color: rgba(0, 0, 0, 0.075);

        td:first-child {
          color: orange;
          font-weight: bold;
          font-size: 100%;
          border-top: 1px solid rgba(255,255,255,0.1) !important;

          .td-contents {
            div {
              white-space: initial;
            }
          }
        }
      }

      tr.data-row:not(.selected) {
        td {
          padding: 0;
        }

        .td-contents {
          max-height: 0px;
        }
      }
    }

    tbody {
      padding-top: 1rem;
    }

    th {
      vertical-align: middle;
    }

    td {
      transition: all $duration;

      &:first-child {
        width: 1px;
        white-space:nowrap;
        transition: all 0ms;
      }

      .td-contents {
        transition: all $duration;
        overflow: hidden;

        div {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .td:first-child, .th:first-child {
      min-width: 2rem !important;
      $w: 8rem;
      width: $w;
      min-width: $w;
      max-width: $w;
      word-break: break-all;
      text-align: left;
      padding-right: 0;
    }

    .type-integer {
      color: #90CAF9;
    }

    .type-string {
      color: $success;
    }

    .type-boolean {
      color: lighten(#E040FB, 20%);
      letter-spacing: 2px;
      font-weight: bold;
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

    @for $i from 0 through 40 {
      &.id-length-#{$i} {
        @if 0.7*$i < 2 {
          th:first-child {
            width: 3rem !important;
          }
        }

        td:first-child, th:first-child {
          width: 0.7rem * $i;
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