class Save {
  Save({
    this.equippedSkin = 0,
    List<int>? ownedSkins,
    this.currentStage = 1,
    this.checkpoint = 0,
    this.bestStage = 1,
    this.coins = 0,
    this.totalFly = 0,
    this.unlockedWorld = 1,
    List<int>? perfectStages,
  })  : ownedSkins = ownedSkins ?? [0],
        perfectStages = perfectStages ?? [];

  int equippedSkin;
  List<int> ownedSkins;
  int currentStage;
  int checkpoint;
  int bestStage;
  int coins;
  int totalFly;
  int unlockedWorld;
  List<int> perfectStages;

  Map<String, dynamic> get settings => {
        'haptics': true,
        'sound': true,
        'music': true,
      };
}
