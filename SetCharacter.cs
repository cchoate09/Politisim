using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class SetCharacter : MonoBehaviour
{
    public List<Sprite> charactersToChoose = new List<Sprite>();
    public Image playerName;
    // Start is called before the first frame update
    void Start()
    {
        int index = (int)Variables.Saved.Get("Character");
        playerName.sprite = charactersToChoose[index];
    }

}
