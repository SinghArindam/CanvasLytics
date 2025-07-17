export const dataset = {
    total_rows: 891,
    columns_count: 12,
    missing_values: 866,
    columns: {
      "PassengerId": { "type": "int" }, "Survived": { "type": "int" }, "Pclass": { "type": "int" },
      "Name": { "type": "string" }, "Sex": { "type": "string" }, "Age": { "type": "float" },
      "SibSp": { "type": "int" }, "Parch": { "type": "int" }, "Ticket": { "type": "string" },
      "Fare": { "type": "float" }, "Cabin": { "type": "string" }, "Embarked": { "type": "string" }
    },
    insights: [
      "Women had a 74% survival rate vs 19% for men",
      "First-class passengers were more likely to survive",
      "Children under 10 had higher survival rates",
    ],
    top_questions: [
      "What factors most influenced survival rates?",
      "How did passenger class affect survival?",
      "What was the age distribution of survivors?",
      "Did fare price correlate with survival?",
      "How did family size impact survival chances?"
    ],
  };