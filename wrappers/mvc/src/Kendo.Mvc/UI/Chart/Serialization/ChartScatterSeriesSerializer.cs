namespace Kendo.Mvc.UI
{
    using System.Collections.Generic;
    using Kendo.Mvc.Infrastructure;
    using Kendo.Mvc.Extensions;

    internal class ChartScatterSeriesSerializer : ChartScatterSeriesSerializerBase
    {
        private readonly IChartScatterSeries series;

        public ChartScatterSeriesSerializer(IChartScatterSeries series)
            : base(series)
        {
            this.series = series;
        }

        public override IDictionary<string, object> Serialize()
        {
            var result = base.Serialize();

            var errorBars = series.ErrorBars.CreateSerializer().Serialize();
            if (errorBars.Count > 0)
            {
                result.Add("errorBars", errorBars);
            }

            if (series.ErrorBars.XLowMember.HasValue() && series.ErrorBars.XHighMember.HasValue())
            {
                result["xErrorLowField"] = series.ErrorBars.XLowMember;
                result["xErrorHighField"] = series.ErrorBars.XHighMember;
            }

            if (series.ErrorBars.YLowMember.HasValue() && series.ErrorBars.YHighMember.HasValue())
            {
                result["yErrorLowField"] = series.ErrorBars.YLowMember;
                result["yErrorHighField"] = series.ErrorBars.YHighMember;
            }

            return result;
        }
    }
}