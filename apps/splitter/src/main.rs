use crate::outline_builder::SvgPath;

pub mod outline_builder;

use std::collections::HashMap;
use std::fs;
use ttf_parser::Face;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // let data = fs::read("./font/DejaVuSans.ttf")?;
    let data = fs::read("./font/MaterialIcons-Regular.ttf")?;
    let face = Face::parse(&data, 0)?;
    let mut svg_path_builder = SvgPath::new();

    // Print some basic font info
    print_basic_font_info(&face);

    // Parse codepoints
    let codepoints = parse_codepoints("./font/MaterialIcons-Regular.codepoints")?;

    // Get some glyph
    let codepoint_value = u32::from_str_radix(codepoints["menu"].as_str(), 16)?;
    let c = char::from_u32(codepoint_value).ok_or("Invalid codepoint")?;
    let glyph_id = face.glyph_index(c).ok_or("Glyph not found")?;

    if let Some(bbox) = face.outline_glyph(glyph_id, &mut svg_path_builder) {
        let view_box = format!("{} {} {} {}", bbox.x_min, -bbox.y_max, bbox.width(), bbox.height());
        let svg = wrap_svg(svg_path_builder.0.as_str(), view_box.as_str());
        fs::write("./menu.svg", svg.as_bytes()).expect("Could not create SVG.");
    };

    Ok(())
}

fn print_basic_font_info(face: &Face) {
    let is_reg = face.is_regular();

    let names = face.names();

    for name in names.into_iter() {
        if let Some(i) = name.to_string() {
            println!("{}", i);
        };
    }

    println!("Font is regualar? {}", is_reg);
    println!("Number of glyphs: {}", face.number_of_glyphs());
}

fn parse_codepoints(path: &str) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let codepoints_text = fs::read_to_string(path)?
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
