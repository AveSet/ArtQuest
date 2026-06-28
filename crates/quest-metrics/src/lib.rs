use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[napi(object)]
pub struct QuestMetricsInput {
  pub xp: i32,
  pub estimated_time: i32,
  pub difficulty: String,
  pub is_repeatable: bool,
  pub streak_bonus: i32,
  pub review_after_days: i32,
  pub completions: i32,
}

#[derive(Serialize, Deserialize)]
#[napi(object)]
pub struct QuestMetricsEstimate {
  pub time_required_minutes: i32,
  pub estimated_calories: i32,
  pub focus_factor: f64,
  pub experience_multiplier: f64,
  pub review_interval_days: i32,
}

#[napi]
pub fn estimate_quest_metrics(input: QuestMetricsInput) -> QuestMetricsEstimate {
  let difficulty_mult = match input.difficulty.as_str() {
    "novice" => 1.0,
    "intermediate" => 1.5,
    "advanced" => 2.0,
    "master" => 3.0,
    "expert" => 5.0,
    _ => 1.0,
  };

  let base_time = input.estimated_time.max(1);
  let focus_factor = if input.is_repeatable { 0.85 } else { 1.0 };
  let experience_mult = difficulty_mult * (1.0 + (input.completions as f64) * 0.1);

  QuestMetricsEstimate {
    time_required_minutes: (base_time as f64 * difficulty_mult) as i32,
    estimated_calories: (input.xp * 3) as i32,
    focus_factor,
    experience_multiplier: experience_mult,
    review_interval_days: if input.review_after_days > 0 {
      (input.review_after_days as f64 * difficulty_mult).round() as i32
    } else {
      input.review_after_days
    },
  }
}

#[napi]
pub fn batch_estimate(quests: Vec<QuestMetricsInput>) -> Vec<QuestMetricsEstimate> {
  quests.into_iter().map(|q| estimate_quest_metrics(q)).collect()
}

#[napi]
pub fn calculate_streak_bonus(streak_days: i32) -> i32 {
  match streak_days {
    0..=2 => 0,
    3..=6 => streak_days * 5,
    7..=13 => streak_days * 10 + 20,
    _ => streak_days * 15 + 50,
  }
}
