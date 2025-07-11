// Simulating the dataset provided in the original app.js
export const titanicDataset = {
    total_rows: 891,
    columns: {
        "PassengerId": {"type": "int", "missing": 0, "unique": 891},
        "Survived": {"type": "int", "missing": 0, "values": [0, 1]},
        "Pclass": {"type": "int", "missing": 0, "values": [1, 2, 3]},
        "Name": {"type": "string", "missing": 0, "unique": 891},
        "Sex": {"type": "string", "missing": 0, "values": ["male", "female"]},
        "Age": {"type": "float", "missing": 177, "range": [0.42, 80]},
        "SibSp": {"type": "int", "missing": 0, "range": [0, 8]},
        "Parch": {"type": "int", "missing": 0, "range": [0, 6]},
        "Ticket": {"type": "string", "missing": 0, "unique": 681},
        "Fare": {"type": "float", "missing": 0, "range": [0, 512.33]},
        "Cabin": {"type": "string", "missing": 687, "unique": 147},
        "Embarked": {"type": "string", "missing": 2, "values": ["C", "Q", "S"]}
    },
    survival_stats: {
        overall_survival_rate: 0.384,
        male_survival_rate: 0.189,
        female_survival_rate: 0.742,
        class_1_survival_rate: 0.630,
        class_2_survival_rate: 0.473,
        class_3_survival_rate: 0.242
    },
    insights: [
        "Women had a 74% survival rate vs 19% for men",
        "First-class passengers were 3x more likely to survive",
        "Children under 10 had higher survival rates",
        "Port of embarkation showed survival differences",
        "Higher fare passengers had better survival odds"
    ],
    top_questions: [
        "What factors most influenced survival rates?",
        "How did passenger class affect survival?",
        "What was the age distribution of survivors?",
        "Did fare price correlate with survival?",
        "How did family size impact survival chances?"
    ],
    model_results: {
        accuracy: 0.823,
        precision: 0.791,
        recall: 0.768,
        f1_score: 0.779,
        feature_importance: {
            "Sex": 0.287,
            "Fare": 0.268,
            "Age": 0.178,
            "Pclass": 0.156,
            "SibSp": 0.061,
            "Parch": 0.050
        }
    }
};