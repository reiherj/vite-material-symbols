use ttf_parser::OutlineBuilder;

pub struct SvgPath(pub String);

impl SvgPath {
    pub fn new() -> Self {
        SvgPath(String::new())
    }
}

impl OutlineBuilder for SvgPath {
    fn move_to(&mut self, x: f32, y: f32) {
        self.0 += &format!("M{} {} ", x, -y);
    }

    fn line_to(&mut self, x: f32, y: f32) {
        self.0 += &format!("L{} {} ", x, -y);
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.0 += &format!("Q{} {} {} {} ", x1, -y1, x, -y);
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.0 += &format!("C{} {} {} {} {} {} ", x1, -y1, x2, -y2, x, -y);
    }

    fn close(&mut self) {
        self.0 += "Z ";
    }
}
