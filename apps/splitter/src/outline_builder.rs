use ttf_parser::OutlineBuilder;

pub struct SvgPath {
    pub path: String,
    pub scale_factor: f32,
}

impl SvgPath {
    pub fn new() -> Self {
        SvgPath {
            path: String::new(),
            scale_factor: 10.0,
        }
    }

    pub fn scale(&self, f: f32) -> f32 {
        &self.scale_factor * f
    }
}

impl OutlineBuilder for SvgPath {
    fn move_to(&mut self, x: f32, y: f32) {
        self.path += &format!("M{} {} ", self.scale(x), -self.scale(y));
    }

    fn line_to(&mut self, x: f32, y: f32) {
        self.path += &format!("L{} {} ", self.scale(x), -self.scale(y));
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.path += &format!(
            "Q{} {} {} {} ",
            self.scale(x1),
            -self.scale(y1),
            self.scale(x),
            -self.scale(y)
        );
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.path += &format!(
            "C{} {} {} {} {} {} ",
            self.scale(x1),
            -self.scale(y1),
            self.scale(x2),
            -self.scale(y2),
            self.scale(x),
            -self.scale(y)
        );
    }

    fn close(&mut self) {
        self.path += "Z ";
    }
}
