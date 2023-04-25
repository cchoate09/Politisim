using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class PrimaryStates : MonoBehaviour
{
    public TextMeshProUGUI textSpace;
    public TextAsset txt;
    public List<string> lines;
    public int curPrimary;
    public int displayPrimaries = 4;
    public bool dem;

    // Start is called before the first frame update
    void Start()
    {
        dem = (bool)Variables.Saved.Get("Democrats");
        curPrimary = (int)Variables.Saved.Get("curPrimary");
        if (dem)
        {
            txt = (TextAsset)Resources.Load("PrimaryStateData_D", typeof(TextAsset));
        }
        else
        {
            txt = (TextAsset)Resources.Load("PrimaryStateData_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());
        string displayText = "Next Primaries: ";

        for (int i = curPrimary; i < Mathf.Min(curPrimary + displayPrimaries, lines.Count()); i++)
        {
            List<string> oneLine;
            oneLine = lines[i].Split('\t').ToList();
            displayText = displayText + oneLine[0] + ", ";
        }
        displayText = displayText.Remove(displayText.Length-2);
        textSpace.text = displayText;

    }
}
