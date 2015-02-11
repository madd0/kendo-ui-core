module CodeGen::MVC6::Wrappers

    class Generator
        include Rake::DSL

        def initialize(path)
            @path = path
        end

        def component(component)
            write_events(component)
        end

        def write_events(component)
            return if component.events.empty?

            filename = "#{@path}/#{component.path}/Fluent/#{component.csharp_class}EventBuilder.cs"

            write_file(filename, component.to_events(filename))
        end

        def write_file(filename, content)
            $stderr.puts("Updating #{filename}") if VERBOSE

            ensure_path(filename)

            File.write(filename, content.dos)
        end
    end

end
