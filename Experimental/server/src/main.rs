mod error;
mod lua;
mod types;

use error::Errors;
use simplelog::{ColorChoice, LevelFilter, TermLogger, TerminalMode};
use tiny_http::Server;
use types::Request;

extern crate simplelog;

// TODO: Async (Tokio)

fn parse_request(request: &mut tiny_http::Request) -> Result<Request, Errors> {
    let mut buf = String::new();

    match request.as_reader().read_to_string(&mut buf) {
        Ok(body) => body,
        Err(e) => {
            return Err(Errors::InvalidRequest(format!(
                "Invalid request: {}",
                e.to_string()
            )))
        }
    };

    let request: Request = match serde_json::from_str(&buf) {
        Ok(request) => request,
        Err(e) => {
            return Err(Errors::InvalidRequest(format!(
                "Invalid request: {}",
                e.to_string()
            )))
        }
    };

    Ok(request)
}

fn handle_request(request: Request) -> Result<String, Errors> {
    let lua = lua::create_lua_ctx(request.channel, request.user)?;
    let result = lua::eval(&lua, &request.command)?;
    log::info!("Result: {}", result);

    Ok(result)
}

fn main() {
    let simple_config = simplelog::ConfigBuilder::new()
        .set_location_level(LevelFilter::Trace)
        .set_time_level(LevelFilter::Trace)
        .set_target_level(LevelFilter::Trace)
        .build();

    TermLogger::init(
        LevelFilter::Debug,
        simple_config,
        TerminalMode::Mixed,
        ColorChoice::Always,
    )
    .unwrap();

    let port = std::env::args().nth(1).unwrap_or("8080".to_string());

    log::info!("Starting server on port {}", port);

    let server = Server::http(format!("0.0.0.0:{}", port)).unwrap();

    for mut request in server.incoming_requests() {
        log::info!("Received request: {:?}", request);

        let body = match parse_request(&mut request) {
            Ok(body) => body,
            Err(e) => {
                log::error!("Error: {:?}", e);
                continue;
            }
        };

        log::info!("Parsed request: {:?}", body);

        match handle_request(body) {
            Ok(res) => {
                request
                    .respond(tiny_http::Response::from_string(res))
                    .unwrap();
            }
            Err(e) => {
                log::error!("Error: {:?}", e);

                match e {
                    Errors::InvalidRequest(e) => {
                        request
                            .respond(tiny_http::Response::from_string(e))
                            .unwrap();
                    }
                    Errors::LuaError(e) => {
                        // split by newline and get first line
                        let first_line = e
                            .to_string()
                            .split('\n')
                            .next()
                            .unwrap_or("Unknown error")
                            .to_string();

                        request
                            .respond(tiny_http::Response::from_string(first_line))
                            .unwrap();
                    }
                }
            }
        }
    }
}
