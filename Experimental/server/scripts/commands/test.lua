---@class TestCommand : Command
local TestCommand = {}

function TestCommand:name()
    return "test"
end

function TestCommand:help()
    return "This is a test command"
end

---@param args string[]
function TestCommand:execute(args)
    Channel.get:reply("FeelsDankMan")
    
    return "FeelsDankMan 👉 " .. Invoker.get:name() .. " 👈 FeelsDankMan" 
end

DoRegisterCommand(TestCommand)