require 'codegen/lib/mvc-6/options'
require 'codegen/lib/mvc-6/option'
require 'codegen/lib/mvc-6/composite_option'
require 'codegen/lib/mvc-6/event'

module CodeGen::MVC6::Wrappers

    class Component < CodeGen::Component
        include Options

        COMPONENT = ERB.new(File.read("build/codegen/lib/mvc-6/component.erb"), 0, '%<>')
        COMPONENT_SETTINGS = ERB.new(File.read("build/codegen/lib/mvc-6/component-settings.erb"), 0, '%<>')
        COMPOSITE_OPTION = ERB.new(File.read("build/codegen/lib/mvc-6/composite-option.erb"), 0, '%<>')
        COMPOSITE_OPTION_SETTINGS = ERB.new(File.read("build/codegen/lib/mvc-6/composite-option-settings.erb"), 0, '%<>')
        EVENT = ERB.new(File.read("build/codegen/lib/mvc-6/event-builder.erb"), 0, '%<>')
        BUILDER = ERB.new(File.read("build/codegen/lib/mvc-6/component-builder.erb"), 0, '%<>')
        BUILDER_SETTINGS = ERB.new(File.read("build/codegen/lib/mvc-6/component-builder-settings.erb"), 0, '%<>')

        def path
            name
        end

        def csharp_class
            name
        end

        def csharp_builder_class
            "#{csharp_class}Builder"
        end

        def event_class
            Event
        end

        def to_component()
            COMPONENT.result(binding)
        end

        def to_component_settings()
            COMPONENT_SETTINGS.result(binding)
        end

        def to_composite_option(option)
            COMPOSITE_OPTION.result(option.get_binding)
        end

        def to_composite_option_settings(option)
            COMPOSITE_OPTION_SETTINGS.result(option.get_binding)
        end

        def to_events()
            EVENT.result(binding)
        end

        def to_builder()
            BUILDER.result(binding)
        end

        def to_builder_settings()
            BUILDER_SETTINGS.result(binding)
        end

        def enum_options
            enums = simple_options.select{ |o| !o.values.nil? }
            composite = composite_options.flat_map { |o| o.options }

            composite.each do |item|
                composite.push(*item.options) if item.composite?

                enums.push(item) if !item.values.nil?
            end

            enums
        end
    end

end
