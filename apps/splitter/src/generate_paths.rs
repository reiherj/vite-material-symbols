use crate::outline_builder::SvgPath;
use std::cell::{LazyCell, RefCell};
use std::collections::HashMap;
use ttf_parser::{Face, Tag};

pub static MATERIAL_SYMBOLS_TTF: &[u8] = include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/font/material-symbols-outlined.ttf"
));

pub static CODEPOINTS: &[u8] = include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/font/material-symbols-outlined.codepoints"
));

thread_local! {
    // One RefCell<Face> per wasm instance/thread
    static FACE: LazyCell<RefCell<Face<'static>>> = LazyCell::new(|| {
        let face = Face::parse(MATERIAL_SYMBOLS_TTF, 0).expect("valid font");
        RefCell::new(face)
    });
}

pub fn generate_paths(icon_name: &str, weight: i16) -> Result<String, Box<dyn std::error::Error>> {
    FACE.with(|cell| {
        let mut face = cell.borrow_mut();
        let converted_weight = (weight as f32) / 1000.0_f32;

        let mut svg_path_builder = SvgPath::new();

        // Set variation
        face.set_variation(Tag::from_bytes(b"wght"), converted_weight);

        let codepoints = parse_codepoints()?;
        let codepoint_value = u32::from_str_radix(codepoints[icon_name].as_str(), 16)?;
        let c = char::from_u32(codepoint_value).ok_or("Invalid codepoint")?;
        let glyph_id = face.glyph_index(c).ok_or("Glyph not found")?;

        // The glyphs need to be uniformly sized
        let upm = face.units_per_em();
        let target_size: f32 = 48.0;
        let scale = target_size / upm as f32;

        svg_path_builder.scale_factor = scale;
        face.outline_glyph(glyph_id, &mut svg_path_builder);

        let view_box = "0 -48 48 48";
        let svg = wrap_svg(svg_path_builder.path.as_str(), view_box);

        Ok(svg)
    })
}

fn parse_codepoints() -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let codepoints_text = String::from_utf8_lossy(CODEPOINTS)
        .lines()
        .map(|line| {
            let parts: Vec<_> = line.split_whitespace().collect();
            (parts[0].to_string(), parts[1].to_string())
        })
        .collect::<HashMap<String, String>>();
    Ok(codepoints_text)
}

fn wrap_svg(path_data: &str, view_box: &str) -> String {
    format!(
        r#"<svg viewBox="{}" xmlns="http://www.w3.org/2000/svg"><path d="{}"/></svg>"#,
        view_box, path_data
    )
}
