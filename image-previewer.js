/**
* image-previewer.
* @author Cesar E. Contreras <ccdl15c@gmail.com>
*/

(function($) {

  $.fn.previewer = function(options) {
    var settings = $.extend({}, $.fn.previewer.defaults, options);
    var attached = [];
    var tokens = {
      src:     /\[src]/g,
      width:   /\[width]/g,
      height:  /\[height]/g,
      caption: /\[caption]/g,
      name:    /\:[^\s][name]+/g
    };

    function renderAttachedFile(basePath, file) {
      if (attached.indexOf(file.name) != -1) return;

      attached.push(file.name);

      var stream = new FileReader();

      stream.addEventListener('load', function() {
        var filePath = basePath[1] + basePath[2] + file.name;
        var tpl = settings.template;

        tpl = tpl.replace(tokens.src,     stream.result);
        tpl = tpl.replace(tokens.width,   settings.dimen.w);
        tpl = tpl.replace(tokens.height,  settings.dimen.h);
        tpl = tpl.replace(tokens.caption, file.name);

        $(settings.target).append(tpl);
      }, false);

      stream.readAsDataURL(file);
    }

    function runValidation(files, cb) {
      var valid = true;
      var messages = [];

      $(files).each(function() {
        if (!validate(this, messages)) {
          valid = false;
          return;
        }
      });

      if (valid) {
        cb(true);
      } else {
        cb(false, messages);
      }
    }

    function validate(file, messages) {
      if (!validateFileExtension(file)) {
        var msg = settings.messages.invalidExtension;
        msg = msg.replace(tokens.name, file.name);

        messages.push(msg);

        return;
      };

      if (!validateFileSize(file)) {
        var msg = settings.messages.invalidSize;
        msg = msg.replace(tokens.name, file.name);

        messages.push(msg);

        return;
      };

      return true;
    }

    function validateFileSize(file) {
      var size = file.size / 1024;

      if (settings.size.min > 0) {
        if (size < settings.size.min) return false;
      }

      if (settings.size.max > 0) {
        if (size > settings.size.max) return false;
      }

      return true;
    }

    function validateFileExtension(file) {
      return (settings.mimes.indexOf(file.type) >= 0);
    }

    function getBasePath(file) {
      var regex = /^(.+?)([\\|\/])(?:[\w]+\..+)$/;
      return (file !== '') ? file.replace(/\\/, '\\').match(regex) : null;
    }

    function clear($element) {
      $(settings.target).html('');
      attached = [];
      $element.val(null);
    }

    return this.each(function() {
      var $element = $(this);

      if ($element.is('input[type="file"]')) {
        $element.on('change', function(e) {
          var target = e.target;
          var _return = true;
          var basePath = getBasePath(target.value);

          if (basePath !== null) {
            var files = target.files;

            runValidation(files, function(valid, messages) {
              if (!valid) {
                _return = false;
                clear($element);

                if ($.isFunction(settings.onValidationFailed))
                settings.onValidationFailed(messages);

                return;
              }

              $(files).each(function() {
                renderAttachedFile(basePath, this);
              });
            });
          }

          return _return;
        });
      }
    });
  }

  $.fn.previewer.defaults = {
    target: '.preview',
    messages: {
      invalidExtension: 'Invalid extension of :name.',
      invalidSize: 'Invalid size of file :name.'
    },
    onValidationFailed: function(messages) {
      console.log(messages);
    },
    template: '<div><img src="[src]" width="[width]" height="[height]"><p>[caption]</p></div>',
    dimen: {
      w: 250,
      h: 250
    },
    size: {
      min: 512,
      max: 2048
    },
    mimes: ['image/jpeg', 'image/png', 'image/gif']
  };

})(jQuery);
