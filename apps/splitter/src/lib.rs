use wasm_bindgen::prelude::*;
use ttf_parser::Face;

pub mod generate_paths;
pub mod outline_builder;

pub use generate_paths::generate_paths;

#[wasm_bindgen]
pub struct MaterialSymbols {
    data: Vec<u8>,
}

#[wasm_bindgen]
impl MaterialSymbols {
    #[wasm_bindgen(constructor)]
    pub fn new(bytes: &[u8]) -> Result<MaterialSymbols, JsValue> {
        Face::parse(bytes, 0).expect("Font should be parsed correctly.");
        Ok(MaterialSymbols {
            data: bytes.to_vec(),
        })
    }
}
