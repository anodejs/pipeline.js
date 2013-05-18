module.exports = function(data, next) {
  edge = require('edge'); // lazy load clr

  var draw = edge.func(function() {/*
    //#r "System.Drawing.dll"
    using System;
    using System.Drawing;
    using System.IO;
    using System.Threading.Tasks;
    using System.Collections.Generic;

    public class Startup
    {
      public async Task<object> Invoke(object input)
      {
        IDictionary<string, object> payload = (IDictionary<string,object>)input;
        return MandelbrotSet((int)payload["width"], (int)payload["height"], 2, -2, 2, -2);
      }

      public static Bitmap MandelbrotSetBitmap(int width, int height, double maxr, double minr, double maxi, double mini)
      {
        double currentmaxr = maxr;
        double currentmaxi = maxi;
        double currentminr = minr;
        double currentmini = mini;
        Bitmap img = new Bitmap(width, height);
        double zx = 0;
        double zy = 0;
        double cx = 0;
        double cy = 0;
        double xjump = ((maxr - minr) / Convert.ToDouble(img.Width));
        double yjump = ((maxi - mini) / Convert.ToDouble(img.Height));
        double tempzx = 0;
        int loopmax = 1000;
        int loopgo = 0;
        for (int x = 0; x < img.Width; x++)
        {
          cx = (xjump * x) - Math.Abs(minr);
          for (int y = 0; y < img.Height; y++)
          {
            zx = 0;
            zy = 0;
            cy = (yjump * y) - Math.Abs(mini);
            loopgo = 0;
            while (zx * zx + zy * zy <= 4 && loopgo < loopmax)
            {
              loopgo++;
              tempzx = zx;
              zx = (zx * zx) - (zy * zy) + cx;
              zy = (2 * tempzx * zy) + cy;
            }
            if (loopgo != loopmax)
              img.SetPixel(x, y, Color.FromArgb(loopgo % 128 * 2, loopgo % 32 * 7, loopgo % 16 * 14));
            else
              img.SetPixel(x, y, Color.Black);

          }
        }

        return img;
      }

      public static byte[] MandelbrotSet(int width, int height, double maxr, double minr, double maxi, double mini)
      {
        using(MemoryStream stream = new MemoryStream())
        using (var img = MandelbrotSetBitmap(width, height, maxr, minr, maxi, mini))
        {
          img.Save(stream, System.Drawing.Imaging.ImageFormat.Jpeg);                
          return stream.ToArray();
        }
      }
    }
  */});

  return draw(data, next);
}