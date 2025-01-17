<template>
  <div v-if="!hasData">
    <q-skeleton class="skeleton--chart" />
  </div>
  <div v-else>
    <div class="container">
      <div class="row">
        <span class="text--accent container--title--color">{{ title }}</span>
      </div>
      <div class="row chart--value">
        <span class="text--xlg">{{ defaultValue }}</span>
      </div>
      <div class="chart">
        <highcharts :options="chartOptions"></highcharts>
        <chart-filter :range-filter="rangeFilter" @filterChanged="handleFilterChanged" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { Chart } from 'highcharts-vue';
import { useStore } from 'src/store';
import ChartFilter, { DEFAULT_FILTER } from 'src/components/dashboard/ChartFilter.vue';

export default defineComponent({
  components: {
    highcharts: Chart,
    ChartFilter,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    defaultValue: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    rangeFilter: {
      type: String,
      default: DEFAULT_FILTER,
    },
  },
  emits: ['filterChanged'],
  setup(props, { emit }) {
    const store = useStore();
    const isDarkTheme = computed(() => store.getters['general/theme'] === 'DARK');
    const getBackgroundColor = (): string => (isDarkTheme.value ? '#222829' : '#fff');
    const getLineColor = (): string => (isDarkTheme.value ? 'rgba(108,111,111,0.1)' : '#F7F7F8');
    const getTextColor = (): string => (isDarkTheme.value ? '#5F656F' : '#B1B7C1');
    // const getChartFillColor = (): string => (isDarkTheme.value ? '#1d2d36' : '#F7F7F8');
    const hasData = ref<boolean>(false);

    const chartOptions = ref({
      title: {
        text: '',
      },
      chart: {
        backgroundColor: getBackgroundColor(),
        zoomType: 'x',
        height: '200px',
      },
      xAxis: {
        type: 'datetime',
        lineColor: getLineColor(),
        tickColor: getLineColor(),
        labels: {
          style: {
            color: getTextColor(),
          },
        },
      },
      yAxis: {
        title: {
          text: '',
        },
        gridLineColor: getLineColor(),
        labels: {
          style: {
            color: getTextColor(),
          },
        },
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        area: {
          marker: {
            radius: 0,
          },
          lineWidth: 1,
          states: {
            hover: {
              lineWidth: 1,
            },
          },
          threshold: null,
        },
      },
      series: [
        {
          name: props.title,
          type: 'area',
          data: props.data,
          color: '#0085FF',
          // linear-gradient(90deg, rgba(12, 134, 245, 0) -21.78%, rgba(7, 200, 254, 0.26) 95.18%);
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(7, 200, 254, 0.26)'],
              [1, 'rgba(12, 134, 245, 0.2)'],
            ],
          },
          lineWidth: '2px',
        },
      ],
      credits: {
        enabled: false,
      },
    });

    watch([isDarkTheme], () => {
      chartOptions.value.chart.backgroundColor = getBackgroundColor();
      chartOptions.value.xAxis.lineColor = getLineColor();
      chartOptions.value.xAxis.tickColor = getLineColor();
      chartOptions.value.yAxis.gridLineColor = getLineColor();
      chartOptions.value.yAxis.labels.style.color = getTextColor();
      chartOptions.value.xAxis.labels.style.color = getTextColor();
      // chartOptions.value.series[0].fillColor = getChartFillColor();
    });

    const handleFilterChanged = (filter: string): void => {
      emit('filterChanged', filter);
    };

    watch([props], () => {
      chartOptions.value.series[0].data = props.data;

      if (props.data && props.data.length > 0) {
        hasData.value = true;
      } else {
        hasData.value = false;
      }
    });

    return {
      chartOptions,
      hasData,
      handleFilterChanged,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'src/components/dashboard/styles/chart-panel.scss';
</style>
